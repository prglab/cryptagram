#!/usr/bin/env python
import logging
import PyV8
from json import JSONEncoder, JSONDecoder

class V8Cipher(PyV8.JSClass):
  sjcljs = 'sjcl.js'

  def __init__(self, password):
    self.password = password
    PyV8.JSClass.__init__(self)

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


