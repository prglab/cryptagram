#!/usr/bin/env python

import logging
import base64
from Crypto.Cipher import AES

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
    logging.info('Encrypting message.')
    encrypted_message = self.cipher.encrypt(self._pad(message))
    logging.info('Message encrypted')
    return base64.b64encode(encrypted_message)

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
