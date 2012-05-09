'''
Created on May 8, 2012

@author: tierney

pyexiv2 requires that our input file is actually a file (StringIOs do not
appear to work).
'''

import cStringIO
import logging
from PIL import Image
from PIL.ExifTags import TAGS

class Orientation(object):
  metadata = None
  retrieved_metadata = False

  def __init__(self, image_path):
    self.image_path = image_path

  @staticmethod
  def get_exif_data(filename):
    """Get embedded EXIF data from image file."""
    ret = {}
    try:
      img = Image.open(filename)
      if hasattr(img, '_getexif'):
        exifinfo = img._getexif()
        if exifinfo != None:
          for tag, value in exifinfo.items():
            decoded = TAGS.get(tag, tag)
            ret[decoded] = value
    except IOError, e:
      logging.error(str(e) + ' %s.' % filename)
    return ret

  def _get_metadata(self):
    self.metadata = self.get_exif_data(self.image_path)
    self.retrieved_metadata = True

  def get_orientation(self):
    if not self.retrieved_metadata:
      self._get_metadata()

    metadata_ret_val = 1 # Default is "correct orientation."
    if 'Orientation' in self.metadata:
      metadata_ret_val = self.metadata['Orientation']
    return metadata_ret_val

  def auto_orient(self, save_path):
    # Our goal is to take an image file and reorient that image. The output
    # will then be saved into a StringIO buffer.
    #
    # EXIF Orientation for the letter F if there is an EXIF tagged but the
    # image is displayed incorrectly.
    #
    #   1        2       3      4         5            6           7          8
    #
    # 888888  888888      88  88      8888888888  88                  88  8888888888
    # 88          88      88  88      88  88      88  88          88  88      88  88
    # 8888      8888    8888  8888    88          8888888888  8888888888          88
    # 88          88      88  88
    # 88          88  888888  888888

    im = Image.open(self.image_path)

    orientation = self.get_orientation()
    logging.info('Orientation value: %d.' % orientation)

    if orientation == 1:
      # Nothing
      mirror = im.copy()
    elif orientation == 2:
      # Vertical Mirror
      mirror = im.transpose(Image.FLIP_LEFT_RIGHT)
    elif orientation == 3:
      # Rotation 180
      mirror = im.transpose(Image.ROTATE_180)
    elif orientation == 4:
      # Horizontal Mirror
      mirror = im.transpose(Image.FLIP_TOP_BOTTOM)
    elif orientation == 5:
      # Horizontal Mirror + Rotation 270
      mirror = im.transpose(Image.FLIP_TOP_BOTTOM).transpose(Image.ROTATE_270)
    elif orientation == 6:
      # Rotation 270
      mirror = im.transpose(Image.ROTATE_270)
    elif orientation == 7:
      # Vertical Mirror + Rotation 270
      mirror = im.transpose(Image.FLIP_LEFT_RIGHT).transpose(Image.ROTATE_270)
    elif orientation == 8:
      # Rotation 90
      mirror = im.transpose(Image.ROTATE_90)
    else:
      mirror = im.copy()

    mirror.save(save_path, "JPEG", quality=95)
    return True

