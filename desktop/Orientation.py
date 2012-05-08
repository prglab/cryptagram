'''
Created on May 8, 2012

@author: tierney

pyexiv2 requires that our input file is actually a file (StringIOs do not 
appear to work).
'''

import pyexiv2
import cStringIO
import logging
from PIL import Image

class Orientation(object):
  metadata = None
  retrieved_metadata = False
  
  def __init__(self, image_path):
    self.image_path = image_path
  
  def _get_metadata(self):
    self.metadata = pyexiv2.ImageMetadata(self.image_path)
    self.metadata.read()
    self.retrieved_metadata = True
    
  def get_orientation(self):
    if not self.retrieved_metadata:
      self._get_metadata()
    
    metadata_ret_val = None
    if 'Exif.Image.Orientation' in self.metadata.exif_keys:
      metadata_ret_val = self.metadata['Exif.Image.Orientation'].value 
    return metadata_ret_val
  
  def set_orientation(self, value):
    if not self.retrieved_metadata:
      self._get_metadata()
    self.metadata['Exif.Image.Orientation'].value = value
    self.metadata.write()
    return True

  def rotate_image(self, degrees, save_path=None):
    im = Image.open(self.image_path)
    rotated = im.rotate(degrees)
    
    if save_path:
      rotated.save(save_path, 'JPEG', quality=95)

    return rotated
  
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
        
    orientation = self.get_orientation()
    logging.info('Orientation value: %d.' % orientation)

    if orientation == 3: 
      self.rotate_image(180, save_path)
      return True
    elif orientation == 6:
      self.rotate_image(90, save_path)
      return True
    elif orientation == 8:
      self.rotate_image(270, save_path)
      return True
    return False