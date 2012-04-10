#!/usr/bin/env python
#
# python code.py --encrypted_image_quality 90 --scale .5 --image ./maple.jpg
# python code.py --image ./maple.jpg --encrypted_image_quality 100 --scale 1 --block_size 2 --ecc

from Crypto.Cipher import AES
from PIL import Image, ImageDraw
from tempfile import NamedTemporaryFile
import PIL
import Queue
import base64
import binascii
import gflags
import logging
import math
import os
import sys
import threading
import time
import rs

logging.basicConfig(filename='code.log', level=logging.INFO,
                    format = '%(asctime)-15s %(levelname)8s %(module)s '\
                      '%(threadName)10s %(thread)16d %(lineno)4d %(message)s')

FLAGS = gflags.FLAGS
gflags.DEFINE_string('image', None, 'image to encode and encrypt',
                     short_name = 'i')
gflags.DEFINE_integer('encrypted_image_quality', 100,
                      'quality to save encrypted image in range (0,100]',
                      short_name = 'e')
gflags.DEFINE_integer('block_size', 2, 'block size to use', short_name = 'b')
gflags.DEFINE_float('scale', 1, 'multiplicative rescale of image',
                    short_name = 's')
gflags.DEFINE_integer('maxdim', 2048,
                      'maximum dimension for uploaded encrypted image',
                      short_name = 'm')
gflags.DEFINE_boolean('enable_diff', False, 'slow diff coordinates image')
gflags.DEFINE_string('password', None, 'Password to encrypt image with.', short_name = 'p')
gflags.DEFINE_integer('threads', 5, 'number of threads', short_name = 't')

gflags.DEFINE_boolean('ecc', False, 'Use ECC encoding.')
gflags.DEFINE_integer('ecc_n', 255, 'codeword length', short_name = 'n')
gflags.DEFINE_integer('ecc_k', 223, 'message byte length', short_name = 'k')

gflags.MarkFlagAsRequired('password')


class Cipher(object):
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
    return base64.b64encode(self.cipher.encrypt(self._pad(message)))

  def decode(self, encoded):
    try:
      b64decoded = base64.b64decode(encoded)
      logging.info('b64decoded len: %d.' % len(b64decoded))
    except TypeError, e:
      logging.error('Incorrect padding (%d, %d): %s.' %
                    (len(encoded), len(b64decoded), str(e)))
      return ''

    try:
      return self.cipher.decrypt(b64decoded).rstrip(self.PADDING)
    except ValueError, e:
      logging.error('Encoded string wrong length (%d, %d): %s.' % \
                      (len(encoded), len(b64decoded), str(e)))
      return ''


class ECCodeRunner(threading.Thread):
  PADDING = '}'

  def __init__(self, coder, in_queue, out_queue):
    self.coder = coder
    self.in_queue = in_queue
    self.out_queue = out_queue
    threading.Thread.__init__(self)

  def run(self):
    for order, encode, block in self.in_queue:
      #logging.info('%s %d.' % ('Encoding' if encode else 'Decoding', order))
      if encode:
        coded_block = self.coder.encode(block)
      else:
        coded_block = self.coder.decode(block).rstrip(self.PADDING)
      self.out_queue.put((order, coded_block))
    return


class ECCoder(object):
  PADDING = '}'

  def __init__(self, n, k):
    self.codeword_length = n
    self.message_byte_length = k
    self.coder = rs.RSCoder(self.codeword_length, self.message_byte_length)

  def _pad(self, s):
    if len(s) == self.message_byte_length:
      return s
    return s + (self.message_byte_length - len(s) \
                  % self.message_byte_length) * self.PADDING

  def _chunk(self, message, encode):
    if encode:
      chunk_length = self.message_byte_length
    else:
      chunk_length = self.codeword_length

    chunked = [message[i:i+chunk_length] for
               i in range(0, len(message), chunk_length)]

    for i, chunk in enumerate(chunked):
      if encode:
        chunked[i] = self._pad(chunk)
      else:
        chunked[i] = chunk

    return tuple(chunked)

  def _threaded_coder(self, message, to_encode):
    blocks = self._chunk(message, to_encode)
    to_code = [(i, to_encode, block) for i, block in enumerate(blocks)]
    num_blocks = int(math.ceil(len(to_code) / (1. * FLAGS.threads)))

    to_code_list = [to_code[i:i+num_blocks] for i in
                    range(0, len(to_code), num_blocks)]

    coded_queue = Queue.Queue()
    threads = []
    for i in range(FLAGS.threads):
      new_encoder = rs.RSCoder(self.codeword_length, self.message_byte_length)
      threads.append(ECCodeRunner(new_encoder, to_code_list[i], coded_queue))

    [t.start() for t in threads]
    [t.join() for t in threads]

    coded_list = []
    # print coded_queue
    while True:
      try:
        dequeued = coded_queue.get_nowait()
      except:
        break
      coded_list.append(dequeued)
    coded_list.sort()

    thread_coded = ''.join([e[1] for e in coded_list])
    return thread_coded

  def encode(self, message):
    return self._threaded_coder(message, True)

  def decode(self, message):
    return self._threaded_coder(message, False)


class SeeMeNotImage(threading.Thread):
  image = None
  b64_image = None
  rgb_image = None

  def __init__(self, image_path, scale, quality=None, block_size=None):
    self.image_path = image_path
    self.scale = scale
    self.quality = quality
    self.block_size = block_size
    threading.Thread.__init__(self)

  def _get_wrgbk(self, block):
    upper_thresh = 150
    lower_thresh = 50
    count = 0
    rt = 0.0
    gt = 0.0
    bt = 0.0

    # logging.debug(str(list(block.getdata())))
    block_len = len(list(block.getdata()))
    for i in range(0, block_len, 4):
      rt += list(block.getdata())[i][0]
      gt += list(block.getdata())[i][1]
      bt += list(block.getdata())[i][2]
      count += 1
    r = rt / count
    g = gt / count
    b = bt / count

    # logging.debug('%(r)f %(g)f %(b)f' % locals())
    if (r > upper_thresh and b > upper_thresh and g > upper_thresh):
      return 0
    if (r < lower_thresh and g < lower_thresh and b < lower_thresh):
      return 4

    # Choose color based on largest value.
    if ( r > g and r > b): return 1
    if ( g > r and g > b): return 2
    if ( b > r and b > g): return 3

    # Bad times...
    logging.info('No match (%(r).0f, %(g).0f, %(b).0f).' % locals())
    return -1

  def rescale(self):
    width, height = self.image.size

    # scale = ((2048 * 2048) / 5.) / (width * height)

    self.image = self.image.resize(
      (int(width * self.scale), int(height * self.scale)))
    logging.info('Rescaled image size: (%d x %d)' % self.image.size)

  def requality(self, quality):
    with NamedTemporaryFile() as fh:
      self.image_path = fh.name + '.jpg'
      logging.info('Temporary file at %s.' % self.image_path)
      self.image.save(self.image_path, quality=quality)
      self.image = Image.open(self.image_path)

  def encode(self):
    with NamedTemporaryFile() as fh:
      image_path = fh.name + '.jpg'
      logging.info('Temporary file at %s.' % image_path)
      self.image.save(image_path)
    with open(image_path, 'rb') as fh:
      initial_data = fh.read()
      self.num_raw_bytes = fh.tell()
      logging.info('Image raw byte size: %d.' % self.num_raw_bytes)

    self.bin_image = initial_data

  def encrypt(self, password):
    # Base64 of the encrypted image data.
    c = Cipher(password)
    self.b64encrypted = c.encode(base64.b64encode(self.bin_image))
    logging.debug('Encrypted b64: ' + self.b64encrypted)
    logging.info('Length of b64encoded: %d.' % len(self.b64encrypted))
    to_hexify = self.b64encrypted

    # ECC encode to hex_string.
    if FLAGS.ecc:
      logging.info('ECCoder called (len: %d).' % len(self.b64encrypted))
      coder = ECCoder(FLAGS.ecc_n, FLAGS.ecc_k)
      encoded = coder.encode(self.b64encrypted)
      logging.info('ECCoder encoded (len: %d).' % len(encoded))
      to_hexify = encoded

    # Hexified data for encoding in the uploaded image.
    hex_data = binascii.hexlify(to_hexify)
    self.enc_orig_hex_data = hex_data
    num_data = len(hex_data)
    logging.debug('Original encrypted hex Data: ' + hex_data)
    logging.info('Length of hex_data: %d' % num_data)

    width, length = self.image.size
    width_power_2 = int(math.ceil(math.log(width, 2)))
    TARGET_WIDTH = 2 ** (width_power_2 + 1)
    logging.info('Width: %d.' % TARGET_WIDTH)

    width = int(TARGET_WIDTH / (self.block_size * 2.))
    height = int(math.ceil(num_data / (1. * width)))
    logging.info('Encrypted image (w x h): (%d x %d).' % (width, height))
    logging.info('Expected image (w x h): (%d x %d).' % \
                    (TARGET_WIDTH, height*self.block_size))

    # Create the base for the encrypted image.
    rgb_image_width = width * self.block_size * 2
    rgb_image_height = height * self.block_size

    self.rgb_image = Image.new('RGB', (rgb_image_width, rgb_image_height))
    colors = [(255,255,255), (255,0,0), (0,255,0), (0,0,255)]
    self.coords = []

    for i, hex_datum in enumerate(hex_data):
      #logging.info('hex_datum (%d): %s.' % (i, hex_datum))
      hex_val = int(hex_datum, 16)
      base4_1 = int(hex_val / 4.0) # Implicit floor.
      base4_0 = int(hex_val - (base4_1 * 4))
      y_coord = int(i / (1. * width))
      x_coord = int(i - (y_coord * width))
      draw = ImageDraw.Draw(self.rgb_image)

      # base4_0
      base4_0_x = int(x_coord * self.block_size * 2)
      base4_0_y = int(y_coord * self.block_size)
      self.coords.append((base4_0_x, base4_0_y))
      base4_0_rectangle = \
          [(base4_0_x, base4_0_y),
           (base4_0_x + self.block_size, base4_0_y + self.block_size)]
      draw.rectangle(base4_0_rectangle, fill=colors[base4_0])

      # base4_1
      base4_1_x = int((x_coord * self.block_size * 2) + self.block_size)
      base4_1_y = int(y_coord * self.block_size)
      self.coords.append((base4_1_x, base4_1_y))
      base4_1_rectangle = \
        [(base4_1_x, base4_1_y),
         (base4_1_x + self.block_size, base4_1_y + self.block_size)]
      draw.rectangle(base4_1_rectangle, fill=colors[base4_1])

    filename = 'rgb.jpg'
    logging.info('Saving %s (quality: %d).' % \
                   (filename, FLAGS.encrypted_image_quality))
    self.rgb_image.save(filename, quality=FLAGS.encrypted_image_quality)
    return filename

  def extract_rgb(self):
    self.rgb_image = Image.open('rgb.jpg')
    width, height = self.rgb_image.size

    # Reconstruct image.
    im = Image.new('RGB', (width,height))

    hex_string = ''
    count = 0
    # self.rgb_image.show()
    for y in range(0, height, self.block_size):
      for x in range(0, width, self.block_size * 2):
        block0 = self.rgb_image.crop(
          (x, y, x + self.block_size, y + self.block_size))
        block1 = self.rgb_image.crop(
          (x + self.block_size, y,
           x + (2 * self.block_size), y + self.block_size))

        hex0 = self._get_wrgbk(block0)
        hex1 = self._get_wrgbk(block1)
        if hex0 < 0 or hex1 < 0:
          logging.info('Trouble at (%(x)4d,%(y)4d) hex0: '\
                         '%(hex0)d hex1: %(hex1)d.' % locals())

        # Found black, stop.
        if (hex0 == 4 or hex1 == 4):
          #logging.info('Supposedly done at (%d, %d).' % (x, y))
          if (x == width or y == height):
            logging.info('Actually done at (%d, %d).' % (x, y))
            break

        # TODO(tierney): Gracefully deal with rounding (instead of %).
        hex_num = (hex0 + hex1 * 4) % 16
        hex_value = hex(hex_num).replace('0x','')
        hex_string += hex_value
        count += 1

        if count != len(hex_string):
          print count, len(hex_string), hex_value, hex0, hex1
          assert(False)

    assert(count == len(hex_string))

    errors = 0
    logging.info('Original count: %d.' % len(self.enc_orig_hex_data))
    for i, orig_hex in enumerate(self.enc_orig_hex_data):
      if i >= len(hex_string):
        break
      if orig_hex != hex_string[i]:
        #logging.info('orig_hex vs hex_string[i]: %s %s' % (orig_hex, hex_string[i]))
        errors += 1
    logging.info('Errors: %d.' % errors)
    logging.info('Extracted count: %d.' % count)
    logging.info('Extracted len(hex_string): %d.' % len(hex_string))
    logging.debug('Extracted hex_string: %s' % hex_string)

    try:
      # TODO(tierney): Different behavior on a Mac?
      self.extracted_base64 = binascii.unhexlify(hex_string)
    except Exception, e:
      logging.error('Unhexlify failure: %s.' % str(e))
      raise

    self.decoded = self.extracted_base64
    logging.debug('Extracted encrypted b64: ' + self.extracted_base64)

    # ECC decode.
    if FLAGS.ecc:
      logging.info('ECCoder decoder called (len %d).' % len(self.extracted_base64))
      coder = ECCoder(FLAGS.ecc_n, FLAGS.ecc_k)
      self.decoded = coder.decode(self.extracted_base64)
      logging.info('ECCoder decoded (len: %d).' % len(self.decoded))

    original = self.b64encrypted

  def decrypt(self, password):
    c = Cipher(password)
    decrypted = c.decode(self.decoded)
    if not decrypted:
      logging.error('Did not decode properly.')
      return False
    to_write = base64.b64decode(decrypted)
    with open('decrypted.jpg', 'wb') as fh:
      fh.write(to_write)
    return True

  def run(self):
    # Open the image.
    self.image = Image.open(self.image_path)

    # Re{scale,quality} image.
    self.rescale()
    self.requality(self.quality)

    self.encode()
    filename = self.encrypt(FLAGS.password)

    self.extract_rgb()

    if self.decrypt(FLAGS.password): print 'Success'
    else: print 'Failure'
    return

def main(argv):
  try:
    argv = FLAGS(argv)  # parse flags
  except gflags.FlagsError, e:
    print '%s\nUsage: %s ARGS\n%s' % (e, sys.argv[0], FLAGS)
    sys.exit(1)

  smni = SeeMeNotImage(FLAGS.image, FLAGS.scale, 100, FLAGS.block_size)
  smni.start()

if __name__ == '__main__':
  main(sys.argv)
