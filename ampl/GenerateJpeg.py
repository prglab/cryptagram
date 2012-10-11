#!/usr/bin/env python
from dct import QuantizationTableFromQuality
import numpy
import operator
import re
import subprocess

kReObjectiveFunction = re.compile('Objective:.*z = (.*) \(MAXimum\)')
kDctConstraint = 'DCT {(eh,ev) in ENTRIES}: sum{h in HORIZONTAL}('\
                 'sum{v in VERTICAL}(alpha[h]*alpha[v]* F[h,v] *'\
                 'cos((PI/8)*(eh + 0.5)*h)*cos((PI/8)*(ev + 0.5)*v))) <= 127;'
kNdctConstraint = 'NDCT {(eh,ev) in ENTRIES}: -1 * sum{h in HORIZONTAL}'\
                  '(sum{v in VERTICAL}(alpha[h]*alpha[v]* F[h,v] *cos((PI/8)*'\
                  '(eh + 0.5)*h)*cos((PI/8)*(ev + 0.5)*v))) <= 128;'

LuminanceQuantizationTable = numpy.array([
  [16, 11, 10, 16, 24, 40, 51, 61],
  [12, 12, 14, 19, 26, 58, 60, 55],
  [14, 13, 16, 24, 40, 57, 69, 56],
  [14, 17, 22, 29, 51, 87, 80, 62],
  [18, 22, 37, 56, 68, 109, 103, 77],
  [24, 35, 55, 64, 81, 104, 113, 92],
  [49, 64, 78, 87, 103, 121, 120, 101],
  [72, 92, 95, 98, 112, 100, 103, 99]])

quality = 76
quant_table = QuantizationTableFromQuality(LuminanceQuantizationTable, quality)

model_base = ''
with open("jpeg.mod",'r') as fh:
  model_base = fh.read()

class Model(object):
  def __init__(self, base):
    self.base = base

  def _AppendToModel(self, line):
    self.base += '\n' + line

  def AddConstraint(self, constraint):
    self._AppendToModel('s.t. ' + constraint)

  def SetObjective(self, objective):
    self._AppendToModel(objective)

  def Run(self):
    # Write out the model and execute.
    with open('temp.mod', 'w') as fh:
      fh.write(self.base + '\nend;\n')

    proc = subprocess.Popen("glpsol -m temp.mod -d jpeg.dat -o temp.sol",
                            shell=True, stdout=subprocess.PIPE)
    proc.communicate()
    return self._ParseForObjective()

  def _ParseForObjective(self):
    # Objective:  z = 942.3571232 (MAXimum)
    results = ''
    with open('temp.sol', 'r') as fh:
      for result in fh.readlines():
        m = re.match(kReObjectiveFunction, result)
        if m:
          return float(m.groups()[0])

def main():
  objective_results = {}

  for i in range(0,8):
    for j in range(0,8):
      model = Model(model_base)
      model.SetObjective('maximize z: F[%d,%d];' % (i,j))
      model.AddConstraint(kDctConstraint)
      model.AddConstraint(kNdctConstraint)
      objective_results[(i,j)] = model.Run()

  (coeff_h, coeff_v), max_val = max(objective_results.iteritems(),
                                    key=operator.itemgetter(1))

  quantiz_ = quant_table[coeff_h, coeff_v]
  print max_val
  print max_val / quantiz_

main()
