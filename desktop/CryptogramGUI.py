#!/usr/bin/env python

# User-friendly SeeMeNot application code. Supports Drag and Drop.
import gc
from Cipher.PyV8Cipher import V8Cipher as Cipher
from Codec import Codec
from Encryptor import Encrypt
from ImageCoder import Base64MessageSymbolCoder, Base64SymbolSignalCoder
from PIL import Image
from Queue import Queue
from SymbolShape import two_square
from encodings import hex_codec
from json import JSONEncoder
from multiprocessing import cpu_count
from tornado.options import define, options
from util import md5hash
import logging
import os
import platform
import shlex
import subprocess
import sys
import threading
import time
import tornado.auth
import tornado.escape
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import urllib
import urllib2
import webbrowser
import cStringIO

_PLATFORM = platform.system()

if _PLATFORM == 'Darwin':
  import objc
  from Foundation import *
  from AppKit import *
  from PyObjCTools import AppHelper


logging.basicConfig(level=logging.INFO,
                    filename='cryptogram.log',
                    format = '%(asctime)-15s %(levelname)8s %(module)20s '\
                      '%(lineno)4d %(message)s')

define("port", default=8888, help="run on the given port", type=int)

_NUM_THREADS = cpu_count() - 1
_ALREADY_ENCRYPTING = False
_CODEC = None

class Application(tornado.web.Application):
  def __init__(self):
    handlers = [
      (r"/", MainHandler),
      (r"/status", StatusHandler),
      (r"/password", PasswordHandler),
      (r"/exit", ExitHandler),
    ]

    settings = dict(
      template_path = os.path.join(os.path.dirname(__file__), 'templates'),
      static_path = os.path.join(os.path.dirname(__file__), 'static')
      )
    tornado.web.Application.__init__(self, handlers, **settings)


class MainHandler(tornado.web.RequestHandler):
  def get(self):
    self.render("index.html")


class StatusHandler(tornado.web.RequestHandler):
  def post(self):
    global _PROGRESS
    logging.info('Asking for status: %s.' % str(_PROGRESS))
    to_return = dict(
      (md5hash(key), {'percent': int(100. * _PROGRESS.get(key)),
                        'path': key,
                        'shortname': '/'.join(key.split('/')[-2:])}
       )
      for key in _PROGRESS)
    self.write(JSONEncoder().encode(to_return))
    logging.info('Returned status.')


class PasswordHandler(tornado.web.RequestHandler):
  def post(self):
    global _CODECS

    password = self.get_argument('password')
    password_again = self.get_argument('password_again')
    if password != password_again:
      logging.warning('Passwords do not match.')
      self.render('index.html')

    [codec.set_password(password) for codec in _CODECS]
    self.render("encrypting.html")


class ExitHandler(tornado.web.RequestHandler):
  def get(self):
    logging.info('Indicated we wanted to quit.')
    self.render('exit.html')
    sys.exit(0)

  def post(self):
    logging.info('Posted quit.')
    self.write('GUI quitting');

    # On mac, we have to shutdown the application before quitting the rest of
    # the process.
    if _PLATFORM == 'Darwin':
      AppHelper.stopEventLoop()

    sys.exit(0)


class GuiCodec(threading.Thread):
  codec = None
  password = None
  #daemon = True

  def __init__(self, queue):
    threading.Thread.__init__(self)
    self.queue = queue

  def set_password(self, password):
    self.password = password

  def _encrypt(self, image_path):
    global _PROGRESS

    image_buffer = cStringIO.StringIO()

    with open(image_path, 'rb') as fh:
      image_buffer.write(fh.read())
      length = fh.tell()
    logging.info('%s has size %d.' % (image_path, length))

    # Update codec based on wh_ratio from given image.
    try:
      image_buffer.seek(0)
      _image = Image.open(image_buffer)
    except IOError, e:
      logging.error(str(e))
      return -1

    _width, _height = _image.size
    wh_ratio = _width / float(_height)

    logging.info('Original im dimens: w (%d) h (%d) ratio (%.2f).' % \
                   (_width, _height, wh_ratio))

    # TODO(tierney): Hard-coded hack for fixed image width.
    self.codec = Codec(two_square, wh_ratio, Base64MessageSymbolCoder(),
                       Base64SymbolSignalCoder(),
                       fixed_width=None)

    cipher = Cipher(self.password)
    crypto = Encrypt(image_buffer, self.codec, cipher)
    try:
      # Potentially resizes the photo.
      encrypted_data = crypto.upload_encrypt()
    except IOError, e:
      logging.error(str(e))
      return -1
    except Exception, e:
      logging.error(str(e))
      return -1

    logging.info('Encrypted data length: %d.' % len(encrypted_data))

    self.codec.set_direction('encode')
    self.codec.set_data(encrypted_data)
    self.codec.start()
    while True:
      im = self.codec.get_result()
      if im:
        break

      # Recording the image progress for the user.
      _PROGRESS[image_path] = self.codec.get_percent_complete()
      logging.info('Progress: %.2f%%.' % (100. * self.codec.get_percent_complete()))
      time.sleep(0.5)

    quality = 95
    logging.info('Saving encrypted jpeg with quality %d.' % quality)
    try:
      with open(image_path + '.encrypted.jpg', 'w') as out_file:
        im.save(out_file, quality=quality)
    except Exception, e:
      logging.error(str(e))
      return -1

    _PROGRESS[image_path] = 1
    del crypto
    return 0

  def run(self):
    global _PROGRESS
    while True:
      if self.password: break
      time.sleep(1)

    while True:
      try:
        image_path = self.queue.get_nowait()
      except Exception, e:
        logging.error('Queue empty? %s.' % str(e))
        break
      _PROGRESS[image_path] = -1

      self._encrypt(image_path)

      self.queue.task_done()
      gc.collect()

class TornadoServer(threading.Thread):
  def __init__(self):
    threading.Thread.__init__(self)

  def run(self):
    tornado.ioloop.IOLoop.instance().start()

if _PLATFORM == 'Darwin':
  class CryptogramMacApp(NSObject):
    statusbar = None

    def applicationDidFinishLaunching_(self, notification):
      logging.info('Finished launching')

      self.statusbar = NSStatusBar.systemStatusBar()
      # Create the statusbar item
      self.statusitem = self.statusbar.statusItemWithLength_(NSVariableStatusItemLength)

      # textInputItem = NSMenuItem.alloc().init()
      # textInputItem.setTitle_('CryptogramInputTitle')

      # textInputItem.setTarget_(textInputItem);
      # textInputItem.setEnabled_(True);

      self.menu = NSMenu.alloc().init()
      menuitem = NSMenuItem.alloc().initWithTitle_action_keyEquivalent_(
        'Sync...', 'sync:', '')
      self.menu.addItem_(menuitem)
      # Default event
      menuitem = NSMenuItem.alloc().initWithTitle_action_keyEquivalent_(
        'Quit', 'terminate:', '')
      self.menu.addItem_(menuitem)
      # Bind it to the status item
      self.statusitem.setMenu_(self.menu)

      # systemTrayMenu = NSMenu.alloc().init();
      # systemTrayMenu.addItem_(textInputItem);

      # systemTrayIcon = systemTray.statusItemWithLength_(NSVariableStatusItemLength)
      # systemTrayIcon.setMenu_(systemTrayMenu);

      # systemTrayIcon.setTitle_("CryptogramTitle");
      # systemTrayIcon.setToolTip_("CryptogramTip");
      # systemTrayIcon.setHighlightMode_(True);


def main(argv):
  global _CODECS, _PROGRESS, _NUM_THREADS
  logging.info(argv)

  _PROGRESS = {}
  queue = Queue()
  passed_values = argv[1:]
  for passed_value in passed_values:
    if os.path.isdir(passed_value):
      logging.info('Treat %s like a directory.' % passed_value)
      for _dir_file in os.path.listdir(passed_value):
        logging.info('Adding %s from %s.' % (_dir_file, passed_value))
        _path = os.path.join(passed_value, _dir_file)

        queue.put(_path)
        _PROGRESS[_path] = -2

    else:
      logging.info('Encrypting %s.' % passed_value)
      queue.put(passed_value)
      _PROGRESS[passed_value] = -2

  _CODECS = [GuiCodec(queue) for i in range(_NUM_THREADS)]
  [codec.start() for codec in _CODECS]

  http_server = tornado.httpserver.HTTPServer(Application())
  http_server.listen(options.port)

  webbrowser.open_new_tab('http://localhost:%d' % options.port)
  tornado_server = TornadoServer()
  tornado_server.start()

  logging.info('Made to the end of the main function.')
  if _PLATFORM == 'Darwin':
    app = NSApplication.sharedApplication()
    delegate = CryptogramMacApp.alloc().init()
    app.setDelegate_(delegate)
    # delegate.setApp_(app)
    setup_menus(app, delegate)
    AppHelper.runEventLoop()

  # TODO(tierney): Should hold the last non-daemon thread here (I think) and 
  # quit when appropriate. Currently, we rely on the GUI thread being 
  # non-daemonized.

def setup_menus(app,delegate):
   mainmenu = NSMenu.alloc().init()
   app.setMainMenu_(mainmenu)
   appMenuItem = NSMenuItem.alloc().initWithTitle_action_keyEquivalent_(
     'Quit',
     'terminate:',
     'q')
   mainmenu.addItem_(appMenuItem)
   appMenu = NSMenu.alloc().init()
   appMenuItem.setSubmenu_(appMenu)
   aboutItem = NSMenuItem.alloc().initWithTitle_action_keyEquivalent_(
     'Quit', 'terminate:', 'q')
   aboutItem.setTarget_(app)
   appMenu.addItem_(aboutItem)

if __name__=='__main__':
  try:
    main(sys.argv)
  except Exception, e:
    logging.error(str(e))
