#!/usr/bin/env python

# User-friendly SeeMeNot application code. Supports Drag and Drop.
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
from os.path import expanduser, isdir, join
from tornado.options import define, options
from util import md5hash
import Orientation
import argparse
import cPickle
import cStringIO
import gc
import json
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

_PLATFORM = platform.system()

if _PLATFORM == 'Darwin':
  import objc
  from Foundation import *
  from AppKit import *
  from PyObjCTools import AppHelper

logging.basicConfig(level=logging.INFO,
                    filename='cryptogram.log',
                    format='%(asctime)-15s %(levelname)8s %(module)20s '\
                      '%(lineno)4d %(message)s')

define("port", default=8888, help="run on the given port", type=int)

_SETTINGS_FILE = 'settings.pkl'
_NUM_THREADS = cpu_count() - 1
_ALREADY_ENCRYPTING = False
_CODEC = None

class Application(tornado.web.Application):
  def __init__(self):
    handlers = [
      (r"/", MainHandler),
      (r"/status", StatusHandler),
      (r"/dnd", DnDHandler),
      (r"/exit", ExitHandler),
      (r"/photo_selection", PhotoSelectionHandler),
      (r"/tree_json", TreeJsonHandler),
    ]

    settings = dict(
      template_path=os.path.join(os.path.dirname(__file__), 'templates'),
      static_path=os.path.join(os.path.dirname(__file__), 'static')
      )
    tornado.web.Application.__init__(self, handlers, **settings)


class MainHandler(tornado.web.RequestHandler):
  def get(self):
    output_directory_default = "~/Desktop/Cryptogram"
    if not os.path.exists(_SETTINGS_FILE):
      with open(_SETTINGS_FILE, 'wb') as fh:
        cPickle.dump({'output_directory_default': output_directory_default},
                     fh)
    with open(_SETTINGS_FILE) as fh:
      settings = cPickle.load(fh)
    output_directory_default = settings['output_directory_default']
    self.render("index.html",
                output_directory_default = output_directory_default)

  def post(self):
    global _CODECS
    password = self.get_argument('password')
    password_again = self.get_argument('password_again')
    logging.info('AJAX posted passwords.')
    if password != password_again:
      logging.warning('Passwords do not match.')
      self.render('index.html')
      return

    # Create the output directory specified by the user. If the directory
    # already exists then we just dump the new encrypted photos into that
    # directory.
    output_directory = self.get_argument('output_dir')
    with open(_SETTINGS_FILE) as fh:
      settings = cPickle.load(fh)
    settings['output_directory_default'] = output_directory
    with open(_SETTINGS_FILE, 'wb') as fh:
      cPickle.dump(settings, fh)

    try:
      expanded_output_dir_path = os.path.expanduser(output_directory)
      if not os.path.exists(expanded_output_dir_path):
        os.makedirs(expanded_output_dir_path)
      output_directory = expanded_output_dir_path
    except Exception, e:
      # If we have problems creating the output directory, we attempt to go down
      # the default route of creating a desktop directory that is time-stamped.
      logging.error('Error setting directory. Using default (Desktop). %s.'
                    % str(e))
      expanded_desktop_path = os.path.expanduser('~/Desktop')
      attempt = -1
      day = time.strftime('%Y%b%d')
      while True:
        attempt += 1
        title = 'Cryptogram_%s_%03d' % (day, attempt)
        logging.info('Attempting to make directory: %s.' % title)
        attempted_path = os.path.join(expanded_desktop_path, title)
        if os.path.exists(attempted_path):
          continue
        os.makedirs(attempted_path)
        output_directory = attempted_path
        break

    # Tell the threads to start working.
    [codec.set_encode_kickstart_values(password, output_directory)
     for codec in _CODECS]


class TreeJsonHandler(tornado.web.RequestHandler):
  def get(self):
    path = self.get_argument('path')
    d = expanduser(path)
    children = []
    for f in sorted(os.listdir(d)):
      # Include directories but not '.' directories.
      if isdir(join(d, f)) and not f.startswith('.'):
        children.append(dict(data = f, attr = {"path" : join(d, f)},
                             state = "closed", children = []))
    if d != '~':
      out = children
    else:
      out = [dict(data = split(d)[1], attr = {"path" : d}, state = 'open',
                  children = children)]

    self.write(json.dumps(out, indent = 2))


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


class DnDHandler(tornado.web.RequestHandler):
  def get(self):
    self.render('dnd.html')


class PhotoSelectionHandler(tornado.web.RequestHandler):
  def get(self):
    self.render('file_selection.html')

  def post(self):
    logging.info('Received web photo selection. Redirecting to password.')

    photos = self.get_argument('files[]')
    logging.info('Photos: %s.' % str(photos))
    self.render('index.html')


class ExitHandler(tornado.web.RequestHandler):
  def get(self):
    logging.info('Indicated we wanted to quit.')

    # On mac, we have to shutdown the application before quitting the rest of
    # the process.
    if _PLATFORM == 'Darwin':
      logging.info('Stopping Mac App EventLoop.')
      AppHelper.stopEventLoop()

    logging.info('Good night.')
    self.render('exit.html')
    sys.exit(0)

  def post(self):
    logging.info('Posted quit.')
    self.write('GUI quitting');

    # On mac, we have to shutdown the application before quitting the rest of
    # the process.
    if _PLATFORM == 'Darwin':
      logging.info('Stopping Mac App EventLoop.')
      AppHelper.stopEventLoop()

    logging.info('Good night.')
    sys.exit(0)


class GuiCodec(threading.Thread):
  """GuiCodec threads drive the heart of the work for the encryption."""
  codec = None
  password = None
  daemon = True

  def __init__(self, queue):
    threading.Thread.__init__(self)
    self.queue = queue

  def set_encode_kickstart_values(self, password, output_directory):
    self.password = password
    self.output_directory = output_directory

  def _encrypt(self, image_path):
    global _PROGRESS
    image_buffer = cStringIO.StringIO()

    try:
      with open(image_path, 'rb') as fh:
        image_buffer.write(fh.read())
        length = fh.tell()
      logging.info('%s has size %d.' % (image_path, length))
    except IOError, e:
      logging.error(str(e))
      return -1

    # Reorient the image, if necessary as determined by auto_orient.
    try:
      reoriented_image_buffer = cStringIO.StringIO()
      orient = Orientation.Orientation(image_path)
      if orient.auto_orient(reoriented_image_buffer):
        logging.info('Reoriented the image so reassigning the image_buffer.')
        del image_buffer
        image_buffer = reoriented_image_buffer
    except IOError, e:
      logging.error(str(e) + ' (%s).' % image_path)
      return -1

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

    # TODO(tierney): Consider adding the header name/label here.
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

    # TODO(tierney): Set the "header" more flexibly/appropriately.
    header = 'aesthete'
    self.codec.set_direction('encode')
    self.codec.set_data(header + encrypted_data)
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
      image_basename = os.path.basename(image_path)
      image_name = os.path.splitext(image_basename)[0]
      save_name = os.path.join(self.output_directory, image_name)
      save_name += '_cryptogram.jpg'

      with open(save_name, 'w') as out_file:
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
        logging.info('Queue empty %s.' % str(e))
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


# ---------------- Darwin (Mac OS X)-related Code ------------------------------
def setup_menus(app, delegate):
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


if _PLATFORM == 'Darwin':
  class CryptogramMacApp(NSObject):
    statusbar = None

    def applicationDidFinishLaunching_(self, notification):
      logging.info('Finished launching')

      self.statusbar = NSStatusBar.systemStatusBar()
      # Create the statusbar item
      self.statusitem = self.statusbar.statusItemWithLength_(NSVariableStatusItemLength)

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
# ---------------- End Darwin (Mac OS X)-related Code --------------------------

def valid_image(path):
  try:
    Image.open(path)
    return True
  except Exception, e:
    logging.error('Validating image error. %s.' % str(e))
    return False

def main(argv):
  global _CODECS, _PROGRESS, _NUM_THREADS

  # Parse arguments from the user.
  parser = argparse.ArgumentParser(
    prog='cryptogram', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
  parser.add_argument('-p', '--password', type=str, default=None,
                      help='TODO Password to encrypt image with.')
  parser.add_argument('photo', nargs='*', default=[], help='Photos to encrypt.')

  FLAGS = parser.parse_args()

  _PROGRESS = {}

  # Start user-facing web server.
  http_server = tornado.httpserver.HTTPServer(Application())
  http_server.listen(options.port)
  tornado_server = TornadoServer()
  tornado_server.start()

  # Build queue of images to encrypt.
  queue = Queue()
  passed_values = FLAGS.photo

  logging.info('Photos: %s.' % passed_values)
  for passed_value in passed_values:
    if os.path.isdir(passed_value):
      logging.info('Treat %s like a directory.' % passed_value)

      for _dir_file in os.listdir(passed_value):
        logging.info('Adding %s from %s.' % (_dir_file, passed_value))
        _path = os.path.join(passed_value, _dir_file)

        if valid_image(_path):
          queue.put(_path)
          _PROGRESS[_path] = -2
    else:
      logging.info('Encrypting %s.' % passed_value)
      if valid_image(passed_value):
        queue.put(passed_value)
        _PROGRESS[passed_value] = -2

  if queue.empty():
    logging.info('Queue empty. Therefore, we need some files.')
    logging.warning('TODO: allow users to select photos.')
    webbrowser.open_new_tab('http://localhost:%d/dnd' % options.port)
    return

  else:
    logging.info('We have a queue ready for action.')
    webbrowser.open_new_tab('http://localhost:%d' % options.port)

  # Spin up codecs for coding process when we are ready.
  _CODECS = [GuiCodec(queue) for i in range(_NUM_THREADS)]
  [codec.start() for codec in _CODECS]

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


if __name__ == '__main__':
  try:
    main(sys.argv)
  except Exception, e:
    logging.error(str(e))
