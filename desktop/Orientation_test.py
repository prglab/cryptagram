'''
Created on May 8, 2012

@author: tierney
'''
import unittest
import Orientation

class OrientationTest(unittest.TestCase):

  def setUp(self):
    orient = Orientation.Orientation('reorient.jpg')
    print orient.get_orientation()
    orient.rotate_image('reoriented.jpg')
    reoriented = Orientation.Orientation('reoriented.jpg')
    print reoriented.get_orientation()


  def tearDown(self):
    pass


  def testName(self):
    pass


if __name__ == "__main__":
  #import sys;sys.argv = ['', 'Test.testName']
  unittest.main()