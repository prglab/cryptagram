
class Bits(object):
  def __init__(self):
    pass

  def FromFile(fh):
    bytes = (ord(b) for b in f.read())
    for b in bytes:
      for i in xrange(8):
        yield (b >> i) & 1

  def FromFilename(filename):
    with open(filename,'r') as fh:
      yield FromFile(fh)

