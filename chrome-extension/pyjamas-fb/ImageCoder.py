#!/usr/bin/env python
from util import bsearch, average

class SymbolSignalCoder(object):
  thresholds = {}
  def symbol_to_signal(self, symbol_val):
    pass
  def signal_to_symbol(self, values):
    pass

class MessageSymbolCoder(object):
  encoding = None
  def message_to_symbol(self, index):
    pass
  def symbol_to_message(self, values):
    pass

class Base64SymbolSignalCoder(SymbolSignalCoder):
  thresholds = { # Well, nine (we add one for "black").
    '0': 235,
    '1': 207,
    '2': 179,
    '3': 151,
    '4': 123,
    '5': 95,
    '6': 67,
    '7': 39,
    '8': 11,
    }

  _inv_thresholds = dict((v,k) for k, v in thresholds.iteritems())

  def symbol_to_signal(self, symbol_val):
    return self.thresholds[symbol_val]

  def signal_to_symbol(self, values):
    ret = []
    for sym_i in values:
      sym_values = values.get(sym_i)
      avg_value = average([average(sym_values.get(coord))
                           for coord in sym_values])
      keys = sorted(self._inv_thresholds.keys())
      _bs = bsearch(keys, avg_value)
      _key = keys[_bs]
      base8 = self._inv_thresholds[_key]
      ret.append(base8)
    return ret

class Base64MessageSymbolCoder(MessageSymbolCoder):
  encoding = 'base64'
  values = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

  def message_to_symbol(self, char):
    index = self.values.find(char)
    octal_val = '%02s' % oct(index)[1:]
    return list(octal_val.replace(' ','0'))

  def symbol_to_message(self, values):
    assert len(values) == 2
    if values[0] == 8 or values[1] == 8:
      return ''
    index = int('%d%d' % (values[0], values[1]), 8)
    ret = self.values[index]
    return ret
