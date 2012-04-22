#!/usr/bin/env python

def bsearch(a, x, lo=0, hi=None):
  def plus_minus_one(val):
    return [val-1, val, val+1]

  if hi is None:
    hi = len(a)-1

  if x < a[lo]: return lo
  if x > a[hi]: return hi

  while lo < hi:
    mid = int((lo+hi)/2)
    midval = a[mid]
    if midval < x:
      lo = mid+1
    elif midval > x:
      hi = mid
    else:
      return mid

  distances = dict()

  _ = []
  for val in [lo, mid, hi]:
    for y in plus_minus_one(val):
      _.append(y)

  for idx in set(_):
    if idx not in range(0, len(a)):
      continue
    distances[abs(x - a[idx])] = idx
  ret_val = distances.get(min(distances.keys()))
  return ret_val

def average(iterable):
  if len(iterable) == 0:
    return 0
  return sum([float(i) for i in iterable]) / len(iterable)
