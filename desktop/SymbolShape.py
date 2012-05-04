#!/usr/bin/env python

class SymbolShape(object):
  # Used for converting shape geometry description into a coordinate map.
  # Shapes take the form of rectangular descriptions (matrices). Specify the
  # coordinate's shape membership by a value greater than zero (zero is reserved
  # for 'empty' coordinates).
  # TODO(tierney): What to do about empty coordinates.

  _analyzed = False
  _index_map = {}
  _width = -1
  _height = -1

  def __init__(self, shape, name):
    self.shape = shape
    self.name = name

  def get_name(self):
    return self.name

  def get_num_symbol_shapes(self):
    # Count the number of distinct symbol_shapes, ignoring zero-valued
    # symbol_shapes.
    self.analyze()
    shapes = self._index_map.keys()
    # Remove zero if we have symbol_shapes that were entered as such.
    if 0 in shapes:
      shapes.remove(0)
    return len(shapes)

  def get_all_symbol_shapes(self):
    self.analyze()
    return self._index_map

  def get_symbol_shape_coords(self, index):
    self.analyze()
    return self._index_map.get(index)

  def get_shape_width(self):
    self.analyze()
    return self._width

  def get_shape_height(self):
    self.analyze()
    return self._height

  def get_shape_size(self):
    self.analyze()
    return self._width, self._height

  def analyze(self):
    if not self._analyzed:
      self._analyze()
      self._analyzed = True
    return self._analyzed

  def _analyze(self):
    self._height = len(self.shape)
    for y, row in enumerate(self.shape):

      # Check width measurement is always the same, or assign one if not already
      # done so.
      if self._width >= 0:
        assert self._width == len(row)
      else:
        self._width = len(row)

      for x, index in enumerate(row):
        if index not in self._index_map:
          self._index_map[index] = set()
        self._index_map[index].add((x,y))


four_square = SymbolShape([[1, 1, 1, 1, 2, 2, 2, 2],
                           [1, 1, 1, 1, 2, 2, 2, 2],
                           [1, 1, 1, 1, 2, 2, 2, 2],
                           [1, 1, 1, 1, 2, 2, 2, 2]],
                          'four_square')

three_square = SymbolShape([[1, 1, 1, 2, 2, 2],
                            [1, 1, 1, 2, 2, 2],
                            [1, 1, 1, 2, 2, 2]],
                           'three_square')

two_by_four = SymbolShape([[1, 1, 1, 1, 2, 2, 2, 2],
                           [1, 1, 1, 1, 2, 2, 2, 2]],
                          'two_by_four')

two_by_three = SymbolShape([[1, 1, 1, 2, 2, 2],
                            [1, 1, 1, 2, 2, 2]],
                           'two_by_three')

two_square = SymbolShape([[1, 1, 2, 2],
                          [1, 1, 2, 2]],
                         'two_square')

two_by_one = SymbolShape([[1, 2],
                          [1, 2]],
                         'two_by_one')

one_square = SymbolShape([[1, 2]],
                         'one_square')
