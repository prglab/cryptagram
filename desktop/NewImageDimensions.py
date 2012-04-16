#!/usr/bin/env python

from math import ceil
class NewImageDimensions(object):
  # Instantiate object. Expected to have set hw_ratio
  symbol_height = None
  symbol_width = None
  _epsilon = .1

  def __init__(self, hw_ratio, data_len, symbol_shape):
    self.hw_ratio = hw_ratio
    self.data_len = data_len
    self.symbol_shape = symbol_shape

  def _round_up(self, val):
    return int(ceil(val))
  def _round_down(self, val):
    return int(val)

  def _calculate_symbol_dims(self):
    # xw = sqrt( ((r +- e)*bh*s) / bw )
    # xh = S / xw

    # Plus calculations.
    num_symbols_wide = (((self.hw_ratio + self._epsilon) * \
                   self.symbol_height * self.data_len) \
                  / (self.symbol_width)) ** .5
    num_symbols_high = self.data_len / float(num_symbols_wide)

    plus_sym_width = self._round_up(num_symbols_wide)
    plus_sym_height = self._round_up(num_symbols_high)

    # Minus calculations
    num_symbols_wide = (((self.hw_ratio - self._epsilon) * \
                   self.symbol_height * self.data_len) \
                  / (self.symbol_width)) ** .5
    num_symbols_high = self.data_len / float(num_symbols_wide)

    minus_sym_width = self._round_up(num_symbols_wide)
    minus_sym_height = self._round_up(num_symbols_high)

    plus_diff = plus_sym_width - \
        (plus_sym_height - self.data_len % plus_sym_width)
    minus_diff = minus_sym_width - \
        (minus_sym_height - self.data_len % minus_sym_width)

    min_diff = min(plus_diff, minus_diff)

    sym_width, sym_height = plus_sym_width, plus_sym_height
    if min_diff != plus_diff:
      sym_width, sym_height = minus_sym_width, minus_sym_height

    # If it turns out that we have an extra row due to rounding, remove it.
    row_discrepancy = sym_height - self._round_up(self.data_len / float(sym_width))
    sym_height -= row_discrepancy

    self.num_symbols_wide = sym_width
    self.num_symbols_high = sym_height

  def _calculate_num_symbols(self):
    assert self.hw_ratio > 0
    self._calculate_symbol_dims()

    self.new_width = self.num_symbols_wide * self.symbol_width
    self.new_height = self.num_symbols_high * self.symbol_height

  def _apply_symbol_shape(self):
    self.symbol_width = self.symbol_shape.get_shape_width()
    self.symbol_height = self.symbol_shape.get_shape_height()

  def get_image_dimensions(self):
    self._apply_symbol_shape()
    self._calculate_num_symbols()
    return self.new_width, self.new_height

  def get_image_symbol_dimensions(self):
    self._apply_symbol_shape()
    self._calculate_num_symbols()
    return self.num_symbols_wide, self.num_symbols_high
