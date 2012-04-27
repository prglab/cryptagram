#!/usr/bin/env python
import os
import logging
import PyV8
from json import JSONDecoder

class V8Cipher(PyV8.JSClass):
  def __init__(self, password):
    self.password = password
    PyV8.JSClass.__init__(self)

    if os.name == 'posix':
      self.sjcljs = 'Cipher/sjcl.js'
    elif os.name == 'mac':
      self.sjcljs = 'sjcl.js'

  def encode(self, message):
    env = V8Cipher(self)
    with open(self.sjcljs) as fh:
      with PyV8.JSContext(env) as ctxt:
        ctxt.eval(fh.read())
        resp = ctxt.eval('sjcl.encrypt("%s", "%s")' % (self.password, message))
        json = JSONDecoder().decode(resp)
    return json

  def decode(self, json_str):
    env = V8Cipher(self)
    with open(self.sjcljs) as fh:
      with PyV8.JSContext(env) as ctxt:
        ctxt.eval(fh.read())
        resp = ctxt.eval('sjcl.decrypt("%s", \'%s\')' % (self.password, json_str))
    return resp
