#!/usr/bin/env python
import platform
import logging
import PyV8
from json import JSONDecoder

class V8Cipher(PyV8.JSClass):
  # NOT THREAD-SAFE. DO NOT USE IN A PYTHON THREAD.
  def __init__(self, password, command_line = False):
    self.password = password
    PyV8.JSClass.__init__(self)

    _platform = platform.system()
    if _platform == 'Linux' or command_line:
      self.sjcljs = 'Cipher/sjcl.js'
    elif _platform == 'Darwin':
      self.sjcljs = 'sjcl.js'

  def encode(self, message):
    logging.info('V8Cipher.encode called.')
    env = V8Cipher(self)
    with open(self.sjcljs) as fh:
      with PyV8.JSIsolate():
        with PyV8.JSContext(env) as ctxt:
          ctxt.eval(fh.read())
          resp = ctxt.eval('sjcl.encrypt("%s", "%s")' % (self.password, message))
          json = JSONDecoder().decode(resp)
    return json

  def decode(self, json_str):
    env = V8Cipher(self)
    with open(self.sjcljs) as fh:
      with PyV8.JSIsolate():
        with PyV8.JSContext(env) as ctxt:
          ctxt.eval(fh.read())
          resp = ctxt.eval('sjcl.decrypt("%s", \'%s\')' % \
                             (self.password, json_str))
    return resp
