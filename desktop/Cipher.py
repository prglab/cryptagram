#!/usr/bin/env python
import logging
import base64
from Crypto.Cipher import AES

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


class PyCryptoCipher(object):
  # the block size for the cipher object; must be 16, 24, or 32 for AES
  BLOCK_SIZE = 32

  # the character used for padding--with a block cipher such as AES, the value
  # you encrypt must be a multiple of BLOCK_SIZE in length.  This character is
  # used to ensure that your value is always a multiple of BLOCK_SIZE
  PADDING = '{'

  def __init__(self, password):
    secret = self._pad(password)
    self.cipher = AES.new(secret)

  def _pad(self, s):
    if len(s) == self.BLOCK_SIZE:
      return s
    return s + (self.BLOCK_SIZE - len(s) % self.BLOCK_SIZE) * self.PADDING

  def encode(self, message):
    # Returns base64 encoded encrypted data.
    return base64.b64encode(self.cipher.encrypt(self._pad(message)))

  def decode(self, encoded):
    try:
      b64decoded = base64.b64decode(encoded)
      logging.info('b64decoded len: %d.' % len(b64decoded))
    except TypeError, e:
      logging.error('Incorrect padding (%d): %s.' % (len(encoded), str(e)))
      return ''

    try:
      return self.cipher.decrypt(b64decoded).rstrip(self.PADDING)
    except ValueError, e:
      logging.error('Encoded string wrong length (%d, %d): %s.' % \
                      (len(encoded), len(b64decoded), str(e)))
      return ''
