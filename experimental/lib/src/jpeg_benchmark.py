#!/usr/bin/env python
import cStringIO
import random
import sys

from PIL import Image

def main(argv):
  im = Image.new('RGB', (8,8))

  # Embed the values that we want into the image.
  pixels = im.load()
  for h in range(8):
    for w in range(8):
      pixels[h,w] = random.choice([(118, 118, 118),
                                   (138, 138, 138)])

  for h in range(8):
    for w in range(8):
      print pixels[h,w],
    print
  print

  image_buffer = cStringIO.StringIO()
  im.save(image_buffer, 'JPEG', quality=72)

  image_buffer.seek(0)
  read_im = Image.open(image_buffer)
  new_pixels = read_im.load()
  for h in range(8):
    for w in range(8):
      print new_pixels[h,w],
    print

  max_obs = 0
  for h in range(8):
    for w in range(8):
      print abs(pixels[h,w][0] - new_pixels[h,w][0]),
    print

if __name__=="__main__":
  main(sys.argv)
