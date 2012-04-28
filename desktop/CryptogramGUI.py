#!/usr/bin/env python

# User-friendly SeeMeNot application code. Supports Drag and Drop.

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

logging.basicConfig(level=logging.INFO,
                    #stream = sys.stdout,
                    filename='cryptogram.log',
                    format = '%(asctime)-15s %(levelname)8s %(module)20s '\
                      '%(lineno)4d %(message)s')

define("port", default=8888, help="run on the given port", type=int)

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


_PROGRESS = 0
class StatusHandler(tornado.web.RequestHandler):
  def post(self):
    global _CODEC, _PROGRESS
    if _CODEC:
      _PROGRESS += 1
      return _PROGRESS
    return 0


class PasswordHandler(tornado.web.RequestHandler):
  def post(self):
    global _ALREADY_ENCRYPTING, _CODEC

    password = self.get_argument('password')
    verify_password = self.get_argument('verify_password')
    if password != verify_password:
      logging.warning('Passwords do not match.')
      self.render('index.html')
      return

    if _ALREADY_ENCRYPTING:
      logging.warning('Return idempotency error.')
      self.render("index.html")
      return

    _ALREADY_ENCRYPTING = True
    self.render("index.html")

    passed_values = sys.argv[1:]
    logging.info('Going to handle: %s.' % str(passed_values))
    logging.info('Password: %s.' % password)
    _CODEC = GuiCodec(passed_values, password, None)
    _CODEC.run()


class ExitHandler(tornado.web.RequestHandler):
  def get(self):
    logging.info('Indicated we wanted to quit.')
    self.render('exit.html')
    sys.exit(0)


class GuiCodec(object):
  # TODO(tierney): Idempotent...
  def __init__(self, passed_values, password, status_bar):
    self.passed_values = passed_values
    self.password = password
    self.status_bar = status_bar

  def get_status(self):
    return 'good'

  def _encrypt(self, image_path):
    # Update codec based on wh_ratio from given image.
    try:
      _image = Image.open(image_path)
    except IOError, e:
      logging.error(str(e))
      return -1
    _width, _height = _image.size
    wh_ratio = _width / float(_height)
    codec = Codec(two_square, wh_ratio, Base64MessageSymbolCoder(),
                  Base64SymbolSignalCoder())

    # Determine file size.
    with open(image_path, 'rb') as fh:
      orig_data = fh.read()
      length = fh.tell()
      logging.info('Image filesize: %d bytes.' % length)

    cipher = Cipher(self.password)
    crypto = Encrypt(image_path, codec, cipher)
    try:
      encrypted_data = crypto.upload_encrypt()
    except IOError, e:
      logging.error(str(e))
      return -1

    logging.info('Encrypted data length: %d.' % len(encrypted_data))
    im = codec.encode(encrypted_data)

    quality = 95
    logging.info('Saving encrypted jpeg with quality %d.' % quality)
    try:
      with open(image_path + '.encrypted.jpg', 'w') as out_file:
        im.save(out_file, quality=quality)
    except Exception, e:
      logging.error(str(e))
      return -1
    return 0

  def run(self):
    logging.info('Got password')
    errors = 0
    for passed_value in self.passed_values:
      if os.path.isdir(passed_value):
        # self.status_bar.set(passed_value)
        logging.info('Treat %s like a directory.' % passed_value)
      else:
        # self.status_bar.set('Encrypting %s...' % os.path.basename(passed_value))
        # self.status_bar.update()
        logging.info('Encrypting %s.' % passed_value)
        ret = self._encrypt(passed_value)
        if ret != 0:
          errors += 1
        logging.info('Completed.')

    # self.status_bar.set('Done (%d %s).' % \
    #                       (errors, 'error' if errors == 1 else 'errors'))
    logging.info('Done so quitting.')


def main(argv):
  logging.info(argv)
  passed_values = argv[1:]

  http_server = tornado.httpserver.HTTPServer(Application())
  http_server.listen(options.port)

  webbrowser.open_new_tab('http://localhost:%d' % options.port)
  tornado.ioloop.IOLoop.instance().start()

if __name__=='__main__':
  main(sys.argv)
