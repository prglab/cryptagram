#!/usr/bin/env python

from util import bsearch
import unittest

class UtilTest(unittest.TestCase):
  def setUp(self):
    self.array = [0, 100, 200, 250, 300, 400, 401, 500]
    self.to_find_int = 200
    self.to_find_float = 400.5

  def test_int(self):
    self.assertEqual(2, bsearch(self.array, self.to_find_int))

  def test_float(self):
    self.assertEqual(6, bsearch(self.array, self.to_find_float))

if __name__ == '__main__':
  unittest.main()
