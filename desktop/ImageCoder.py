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
    '0': 238,
    '1': 210,
    '2': 182,
    '3': 154,
    '4': 126,
    '5': 98,
    '6': 70,
    '7': 42,
    '8': 14,
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
      ret.append(int(self._inv_thresholds[keys[bsearch(keys, avg_value)]]))
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
    return self.values[index]
