#!/usr/bin/env python

from SymbolShape import SymbolShape
import unittest

class TestSymbolShape(unittest.TestCase):
  def setUp(self):
    self.shape = [[1, 2, 2],
                  [1, 1, 2]]
    self.symbol_shape = SymbolShape(self.shape)

  def test_get_num_symbol_shapes(self):
    self.assertEqual(2, self.symbol_shape.get_num_symbol_shapes())

  def test_get_all_symbol_shapes(self):
    symbol_shapes = {1: set([(0, 1), (0, 0), (1, 1)]),
                     2: set([(2, 0), (1, 0), (2, 1)])}
    _ = self.symbol_shape.get_all_symbol_shapes()
    self.assertEqual(_, symbol_shapes)

  def test_get_symbol_shape_coords(self):
    _ = self.symbol_shape.get_symbol_shape_coords(1)
    self.assertEqual(set([(0, 1), (0, 0), (1, 1)]), _)

    _ = self.symbol_shape.get_symbol_shape_coords(2)
    self.assertEqual(set([(2, 0), (1, 0), (2, 1)]), _)

  def test_get_shape_width(self):
    _ = self.symbol_shape.get_shape_width()
    self.assertEqual(3, _)

  def test_get_shape_height(self):
    _ = self.symbol_shape.get_shape_height()
    self.assertEqual(2, _)


if __name__ == '__main__':
  unittest.main()
