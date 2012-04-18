#!/usr/bin/env python

import itertools
def bsearch(a, x, lo=0, hi=None):
  def plus_minus_one(val):
    return [val-1, val, val+1]

  if hi is None:
    hi = len(a)-1

  if x < a[lo]: return lo
  if x > a[hi]: return hi

  while lo < hi:
    mid = (lo+hi)/2
    midval = a[mid]
    if midval < x:
      lo = mid+1
    elif midval > x:
      hi = mid
    else:
      return mid

  distances = dict()
  _ = itertools.chain(*[[y for y in plus_minus_one(val)
                         if y in range(len(a))]
                        for val in [lo, mid, hi]])
  for idx in set(_):
    distances[abs(x - a[idx])] = idx
  return distances.get(min(distances.keys()))

def average(iterable):
  if len(iterable) == 0:
    return 0
  return sum([float(i) for i in iterable]) / len(iterable)
