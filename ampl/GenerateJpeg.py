#!/usr/bin/env python

from dct import QuantizationTableFromQuality
from math import floor
import numpy
import operator
import random
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

  def Run(self, id):
    # Write out the model and execute.
    with open('temp.mod', 'w') as fh:
      fh.write(self.base + '\nend;\n')

    # print "glpsol -m temp.mod -d jpeg.dat -o ID_%d.sol" % id
    proc = subprocess.Popen("glpsol -m temp.mod -d jpeg.dat -o ID_%d.sol" % id,
                            shell=True,
                            stdout=subprocess.PIPE)
    proc.communicate()
    return self._ParseForObjective(id)

  def _ParseForObjective(self, id):
    results = ''
    with open('ID_%d.sol' % id, 'r') as fh:
      for result in fh.readlines():
        m = re.match(kReObjectiveFunction, result)
        if m:
          return float(m.groups()[0])

def main():
  objective_results = {}

  coeffs_order = []
  constraints = {}
  try:
    for k in range(0,20):
      for i in range(0,8):
        for j in range(0,8):
          model = None
          model = Model(model_base)
          model.SetObjective('maximize z: F[%d,%d];' % (i,j))
          model.AddConstraint(kDctConstraint)
          model.AddConstraint(kNdctConstraint)
          for constraint_i, constraint in enumerate(constraints):
            coeff_h, coeff_v = constraint
            model.AddConstraint("FIX_%d_%d: F[%d,%d] = %d;" % \
                                (coeff_h,
                                 coeff_v,
                                 coeff_h,
                                 coeff_v,
                                 constraints[constraint]))

          objective_results[(i,j)] = model.Run(k)

      sorted_results = sorted(objective_results.iteritems(),
                              key=operator.itemgetter(1),
                              reverse=True)

      for result in sorted_results:
        coeffs, max_val = result
        if coeffs in constraints:
          continue

        (coeff_h, coeff_v) = coeffs

        quantiz_ = int(quant_table[coeff_h, coeff_v])
        coeffs_order.append(coeffs)
        import math
        print coeffs, max_val, quantiz_,
        try:
          print math.floor(math.log(max_val / quantiz_, 2))
        except ValueError:
          pass

        # Joined discretization values.
        joined_values = range(0, int(floor(max_val)), quantiz_) + \
                        range(-quantiz_, -int(floor(max_val)), -quantiz_)

        constraints[(coeff_h, coeff_v)] = random.choice(joined_values)
        print "  Chose: ", constraints[(coeff_h, coeff_v)]
        break

  except IndexError:
    with open('ID_%d.sol' % (k - 1)) as fh:
      lines = fh.readlines()
    print coeffs_order
    for line in lines:
      if 'FIX' not in line:
        continue

      sline = line.split()
      fix_h_v = sline[1]
      coeff_h, coeff_v = fix_h_v.split('_')[1:]
      print coeff_h, coeff_v, sline[3]
    return


main()
