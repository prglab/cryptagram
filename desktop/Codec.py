#!/usr/bin/env python
import logging
import threading
from NewImageDimensions import NewImageDimensions
from PIL import Image
from ImageCoder import Base64SymbolSignalCoder, Base64MessageSymbolCoder
from SymbolShape import two_square

class Codec(threading.Thread):
  completed = 0
  data_length = 1
  direction = None
  data = None
  result = None

  def __init__(self, symbol_shape, wh_ratio, message_symbol_coder,
               symbol_signal_coder, fixed_width=None):
    threading.Thread.__init__(self)
    self.symbol_shape = symbol_shape
    self.wh_ratio = wh_ratio
    self.message_symbol_coder = message_symbol_coder
    self.symbol_signal_coder = symbol_signal_coder
    self.fixed_width = fixed_width

  def _new_image_dimensions(self, data):
    data_len = len(data)
    self.set_new_image_dimensions(data_len)

  def set_wh_ratio(self, wh_ratio):
    assert wh_ratio > 0
    logging.info('New wh ratio: %.2f.' % wh_ratio)
    self.wh_ratio = wh_ratio

  def set_new_image_dimensions(self, data_len):
    self.new_image_dimensions = NewImageDimensions(
      self.wh_ratio, data_len, self.symbol_shape, self.fixed_width)

  def get_prospective_image_dimensions(self, data):
    data_len = len(data)
    return self.get_prospective_image_dimensions_from_data_len(data_len)

  def get_prospective_image_dimensions_from_data_len(self, data_len):
    self.set_new_image_dimensions(data_len)
    return self.new_image_dimensions.get_image_dimensions()

  def get_percent_complete(self):
    percent = self.completed / (1. * self.data_length)
    return percent

  def set_data(self, data):
    self.data = data

  def set_direction(self, direction):
    self.direction = direction

  def get_result(self):
    return self.result

  def run(self):
    self.result = None
    if self.direction == 'encode':
      self.encode(self.data)
    elif self.direction == 'decode':
      self.decode(self.data)

  def encode(self, data):
    logging.info('Encoding data.')

    self.data_length = len(data)
    # Set the NewImageDimensions internal state.
    self.set_new_image_dimensions(self.data_length)

    new_image_width, new_image_height = \
        self.new_image_dimensions.get_image_dimensions()
    new_image_num_symbols_width, new_image_num_symbols_height = \
        self.new_image_dimensions.get_image_symbol_dimensions()

    new_image = Image.new('RGB', (new_image_width, new_image_height))
    logging.info('New image dimensions: width (%d) height (%d).' % \
                   (new_image_width, new_image_height))
    logging.info('Num symbols wide: %d. Num symbols high: %d.' % (
        new_image_num_symbols_width, new_image_num_symbols_height))

    pixel = new_image.load()

    shape_width, shape_height = self.symbol_shape.get_shape_size()

    _shape_name = self.symbol_shape.get_name()
    _symbol_to_signal = self.symbol_signal_coder.symbol_to_signal
    _message_to_symbol = self.message_symbol_coder.message_to_symbol
    _num_symbol_shapes = self.symbol_shape.get_num_symbol_shapes()

    coords = {}
    for sym_i in range(_num_symbol_shapes):
      coords[sym_i + 1] = self.symbol_shape.get_symbol_shape_coords(sym_i + 1)

    # TODO(tierney): Encode the header before the payload. Account for header's
    # presence in the way we assign values in the payload.
    header = data[:8]
    payload = data[8:]
    logging.info('Header: %s.' % header)

    # Write the header in the upper-left using our original 2x2 pixel block,
    # three-bit symbol encoding.
    _header_symbol_signal_coder = Base64SymbolSignalCoder()
    _header_message_symbol = Base64MessageSymbolCoder()
    _header_num_symbols_wide = 2.
    for i, header_char in enumerate(header):
      symbol_values = _header_message_symbol.message_to_symbol(header_char)
      _fill_0 = _header_symbol_signal_coder.symbol_to_signal(symbol_values[0])
      fill_0 = (_fill_0, _fill_0, _fill_0)
      _fill_1 = _header_symbol_signal_coder.symbol_to_signal(symbol_values[1])
      fill_1 = (_fill_1, _fill_1, _fill_1)

      y_coord = int(i / _header_num_symbols_wide)
      x_coord = int(i - (y_coord * _header_num_symbols_wide))
      base_x = x_coord * 4. # Shape width.
      base_y = y_coord * 2.

      pixel[base_x + 0, base_y + 0] = fill_0
      pixel[base_x + 1, base_y + 0] = fill_0
      pixel[base_x + 1, base_y + 1] = fill_0
      pixel[base_x + 0, base_y + 1] = fill_0

      pixel[base_x + 2, base_y + 0] = fill_1
      pixel[base_x + 3, base_y + 0] = fill_1
      pixel[base_x + 3, base_y + 1] = fill_1
      pixel[base_x + 2, base_y + 1] = fill_1

    num_header_row_symbols = \
        ((new_image_width - 8) / shape_width) * (8 / shape_height)
    _num_header_row_symbols_wide = (new_image_width - 8) / shape_width
    logging.info('num_header_row_symbols: %d (num sym wide: %d).' % \
                   (num_header_row_symbols, _num_header_row_symbols_wide))

    self.completed = 0
    for i, datum in enumerate(payload):
      self.completed += 1
      symbol_values = _message_to_symbol(datum)
      assert (len(symbol_values) == _num_symbol_shapes)
      _fill_0 = _symbol_to_signal(symbol_values[0])
      fill_0 = (_fill_0, _fill_0, _fill_0)
      _fill_1 = _symbol_to_signal(symbol_values[1])
      fill_1 = (_fill_1, _fill_1, _fill_1)

      if i < num_header_row_symbols:
        y_coord = i / _num_header_row_symbols_wide
        x_coord = (i - (y_coord * _num_header_row_symbols_wide))
        base_x = 8 + (x_coord * shape_width)
      else:
        _i = i + 8 # Account for number of symbols in the header.
        y_coord = int(_i / (1. * new_image_num_symbols_width))
        x_coord = int(_i - (y_coord * new_image_num_symbols_width))
        base_x = x_coord * shape_width
      base_y = y_coord * shape_height

      if _shape_name == 'two_square':
        pixel[base_x + 0, base_y + 0] = fill_0
        pixel[base_x + 1, base_y + 0] = fill_0
        pixel[base_x + 1, base_y + 1] = fill_0
        pixel[base_x + 0, base_y + 1] = fill_0

        pixel[base_x + 2, base_y + 0] = fill_1
        pixel[base_x + 3, base_y + 0] = fill_1
        pixel[base_x + 3, base_y + 1] = fill_1
        pixel[base_x + 2, base_y + 1] = fill_1

      else:
        for sym_i, symbol_val in enumerate(symbol_values):
          fill = _symbol_to_signal(symbol_val)
          for x,y in coords[sym_i + 1]:
            pixel[base_x + x, base_y + y] = (fill, fill, fill)

    self.result = new_image


  def decode(self, read_image):
    width, height = read_image.size
    image = read_image.convert('RGB') # Ensure format is correct.

    shape_width, shape_height = self.symbol_shape.get_shape_size()
    pixels = image.load()

    _num_symbol_shapes = self.symbol_shape.get_num_symbol_shapes()
    _symbol_to_message = self.message_symbol_coder.symbol_to_message
    _signal_to_symbol = self.symbol_signal_coder.signal_to_symbol
    _get_symbol_shape_coords = self.symbol_shape.get_symbol_shape_coords

    def rgb_to_lum(rgb):
      red, green, blue = rgb
      lum = 0.299 * red + 0.587 * green + 0.114 * blue
      return lum

    # Decode the header.
    _header_message_symbol = Base64MessageSymbolCoder()
    _header_signal_symbol = Base64SymbolSignalCoder()
    _header = ''
    for head_row in range(0, 8, 2):
      for head_col in range(0, 8, 4):
        values = {}
        for signal_val in range(2):
          coords = two_square.get_symbol_shape_coords(signal_val+1)
          values[signal_val] = {}
          for x,y in coords:
            values[signal_val][(x,y)] = pixels[head_col + x, head_row + y]
        message = _header_message_symbol.symbol_to_message(
          _header_signal_symbol.signal_to_symbol(values))
        _header += message

    logging.info('Extracted header: %s.' % _header)

    self.data_length = (height * width) / (shape_width * shape_height)

    # Decode payload of image.
    extracted_data = ''
    for y_coord in range(0, height, shape_height):
      for x_coord in range(0, width, shape_width):
        self.completed += 1
        if y_coord < 8 and x_coord < 8:
          continue

        values = {}
        for symbol_val in range(_num_symbol_shapes):
          coords = _get_symbol_shape_coords(symbol_val+1)
          values[symbol_val] = {}
          for x,y in coords:
            values[symbol_val][(x,y)] = pixels[x_coord + x, y_coord + y]

        extracted_datum = _symbol_to_message(_signal_to_symbol(values))
        extracted_data += extracted_datum
    self.result = extracted_data
