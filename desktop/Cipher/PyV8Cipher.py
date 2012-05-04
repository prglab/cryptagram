#!/usr/bin/env python
import os
import logging
import PyV8
import threading
import time
from json import JSONDecoder

class V8Cipher(object):
  def __init__(self, password, command_line = False):
    self.password = password

    if os.path.exists('Cipher/sjcl.js'):
      self.sjcljs = 'Cipher/sjcl.js'
    elif os.path.exists('sjcl.js'):
      self.sjcljs = 'sjcl.js'
    else:
      logging.error('Could not find sjcl.js.')
      raise Exception('Could not find sjcl.js.')

  def _do_code(self, action, message):
    # Based on the specified action, set the coder.
    coder_class = PyV8Encode if action == 'encode' else PyV8Decode

    coder = coder_class(self.password, message, self.sjcljs)
    coder.run()
    while True:
      result = coder.get_result()
      if result:
        break
      time.sleep(0.5)
    return result

  def encode(self, message):
    return self._do_code('encode', message)

  def decode(self, message):
    # Expect message to be a JSON string.
    return self._do_code('decode', message)


class PyV8Encode(threading.Thread):
  result = None

  def __init__(self, password, message, sjcljs):
    threading.Thread.__init__(self)
    self.password = password
    self.message = message
    self.sjcljs = sjcljs

  def get_result(self):
    return self.result

  def run(self):
    with PyV8.JSIsolate():
      with PyV8.JSContext() as context:
        with open(self.sjcljs) as fh:
          sjcl = fh.read()
        context.eval(sjcl)
        resp = context.eval('sjcl.encrypt("%s", "%s");' % (self.password,
                                                           self.message))
        self.result = JSONDecoder().decode(resp)
        del context

class PyV8Decode(threading.Thread):
  result = None

  def __init__(self, password, message, sjcljs):
    threading.Thread.__init__(self)
    self.password = password
    self.message = message
    self.sjcljs = sjcljs

  def get_result(self):
    return self.result

  def run(self):
    with PyV8.JSIsolate():
      with PyV8.JSContext() as context:
        with open(self.sjcljs) as fh:
          sjcl = fh.read()
        context.eval(sjcl)
        resp = context.eval('sjcl.decrypt("%s", \'%s\')' % \
                              (self.password, self.message))
        self.result = resp
        del context

