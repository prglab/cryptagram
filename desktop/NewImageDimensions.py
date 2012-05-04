#!/usr/bin/env python
from math import ceil
import logging
class NewImageDimensions(object):
  symbol_height = None
  symbol_width = None
  _epsilon = 0

  def __init__(self, wh_ratio, data_len, symbol_shape):
    self.wh_ratio = wh_ratio
    self.data_len = data_len
    self.symbol_shape = symbol_shape

  def _round_up(self, val):
    return int(ceil(val))

  def _round_down(self, val):
    return int(val)

  def _calculate_symbol_dims(self):
    # TODO(tierney): The full solution to the problem of calculating symbol
    # dimensions appears to be a quadratically constrained linear program. While
    # these roundings and methods are suboptimal, in practice, things seem to be
    # good enough for now. Improvements welcome :)

    # Rounding based on the following:
    #   xw = sqrt( ((r +- e)*bh*s) / bw )
    #   xh = S / xw

    if self.wh_ratio < 0:
      # Tall images.
      num_symbols_wide = (((self.wh_ratio + self._epsilon) * \
                     self.symbol_height * self.data_len) \
                    / (self.symbol_width)) ** .5
      num_symbols_high = self.data_len / float(num_symbols_wide)

      plus_sym_width = self._round_up(num_symbols_wide)
      plus_sym_height = self._round_up(num_symbols_high)

      sym_width, sym_height = plus_sym_width, plus_sym_height

    else:
      # Wide images.
      num_symbols_wide = (((self.wh_ratio - self._epsilon) * \
                     self.symbol_height * self.data_len) \
                    / (self.symbol_width)) ** .5
      num_symbols_high = self.data_len / float(num_symbols_wide)

      minus_sym_width = self._round_up(num_symbols_wide)
      minus_sym_height = self._round_up(num_symbols_high)

      sym_width, sym_height = minus_sym_width, minus_sym_height

    logging.info('NewImageDimensions dimens: w (%d) h (%d) ratio (%.3f given %.3f).' % \
                   (sym_width * self.symbol_width,
                    sym_height * self.symbol_height,
                    (sym_width * self.symbol_width) / \
                      float(self.symbol_height * sym_height),
                    self.wh_ratio))

    self.new_height = self.symbol_height * sym_height
    self.new_width = self.symbol_width * sym_width
    if (self.new_width) / float(self.new_height) > self.wh_ratio:
      _desired_height = self.new_width / self.wh_ratio
      symbol_rows_to_add = int((_desired_height - self.new_height) / float(self.symbol_height))
      logging.info('symbol_rows_to_add %d.' % symbol_rows_to_add)
      sym_height += symbol_rows_to_add

    self.num_symbols_wide = sym_width
    self.num_symbols_high = sym_height

  def _calculate_num_symbols(self):
    assert self.wh_ratio > 0
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
