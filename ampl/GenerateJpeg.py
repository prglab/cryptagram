#!/usr/bin/env python
import subprocess

contents = ''
with open("jpeg.mod",'r') as fh:
  contents = fh.read()

for i in range(0,8):
  for j in range(0,8):
    model = 'jpeg_%d_%d.mod' % (i,j)
    with open(model,'w') as fh:
      print >>fh, contents
      print >>fh, """
maximize z: F[%d,%d];
  s.t. DCT {(eh,ev) in ENTRIES}: sum{h in HORIZONTAL}(sum{v in VERTICAL}(alpha[h]*alpha[v]* F[h,v] *cos((PI/8)*(eh + 0.5)*h)*cos((PI/8)*(ev + 0.5)*v))) <= 127;
  s.t. NDCT {(eh,ev) in ENTRIES}: -1 * sum{h in HORIZONTAL}(sum{v in VERTICAL}(alpha[h]*alpha[v]* F[h,v] *cos((PI/8)*(eh + 0.5)*h)*cos((PI/8)*(ev + 0.5)*v))) <= 128;
""" % (i,j)

    proc = subprocess.Popen("glpsol -m %s -d jpeg.dat -o %s.sol" % (model, model), shell=True)
    proc.communicate()

