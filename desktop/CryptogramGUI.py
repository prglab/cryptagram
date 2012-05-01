#!/usr/bin/env python

# User-friendly SeeMeNot application code. Supports Drag and Drop.

from Queue import Queue
from Cipher.PyV8Cipher import V8Cipher as Cipher
from Codec import Codec
from Encryptor import Encrypt
from ImageCoder import Base64MessageSymbolCoder, Base64SymbolSignalCoder
from PIL import Image
from SymbolShape import two_square
from encodings import hex_codec
from tornado.options import define, options
import logging
import os
import shlex
import subprocess
import sys
import time
import threading
import tornado.auth
import tornado.escape
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import urllib
import urllib2
import webbrowser
from json import JSONEncoder

logging.basicConfig(level=logging.INFO,
                    #stream = sys.stdout,
                    filename='cryptogram.log',
                    format = '%(asctime)-15s %(levelname)8s %(module)20s '\
                      '%(lineno)4d %(message)s')

define("port", default=8888, help="run on the given port", type=int)

_NUM_THREADS = 4
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


from hashlib import md5
def path_hash(path):
  hash_func = md5()
  hash_func.update(path)
  return hash_func.hexdigest()

class StatusHandler(tornado.web.RequestHandler):
  def post(self):
    global _PROGRESS
    logging.info('Asking for status: %s.' % str(_PROGRESS))
    to_return = dict(
      (path_hash(key), {'percent': int(100. * _PROGRESS.get(key)),
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
    sys.exit(0)


class GuiCodec(threading.Thread):
  codec = None
  password = None
  daemon = True

  def __init__(self, queue):
    threading.Thread.__init__(self)
    self.queue = queue

  def set_password(self, password):
    self.password = password

  def _encrypt(self, image_path):
    global _PROGRESS

    # Update codec based on wh_ratio from given image.
    try:
      _image = Image.open(image_path)
    except IOError, e:
      logging.error(str(e))
      return -1
    _width, _height = _image.size
    wh_ratio = _width / float(_height)

    logging.info('Original im dimens: w (%d) h (%d) ratio (%.2f).' % \
                   (_width, _height, wh_ratio))

    self.codec = Codec(two_square, wh_ratio, Base64MessageSymbolCoder(),
                       Base64SymbolSignalCoder())

    # Determine file size.
    with open(image_path, 'rb') as fh:
      orig_data = fh.read()
      length = fh.tell()
      logging.info('Image filesize: %d bytes.' % length)

    cipher = Cipher(self.password)
    crypto = Encrypt(image_path, self.codec, cipher)
    try:
      # Potentially resizes the photo.
      encrypted_data = crypto.upload_encrypt()
    except IOError, e:
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
  tornado.ioloop.IOLoop.instance().start()

if __name__=='__main__':
  try:
    main(sys.argv)
  except Exception, e:
    logging.error(str(e))
