#!/usr/bin/env python
from hashlib import sha256
import math

def bsearch(a, x, lo=0, hi=None):
  if hi is None:
    hi = len(a)-1

  if x < a[lo]: return lo
  if x > a[hi]: return hi

  while lo <= hi:
    mid = int(math.floor(lo+hi)/2)
    midval = a[mid]
    if midval < x:
      lo = mid+1
      prev_comparison = -1
    elif midval > x:
      hi = mid-1
      prev_comparison = 1
    else:
      return mid

  if prev_comparison < 0:
    option_low = mid
    option_high = mid + 1
  else:
    option_low = mid-1
    option_high = mid

  dist_a = x - a[option_low]
  dist_b = a[option_high] - x

  if dist_a < dist_b:
    return option_low
  else:
    return option_high

def average(iterable):
  if len(iterable) == 0:
    return 0
  return sum([float(i) for i in iterable]) / len(iterable)

def sha256hash(to_hash):
  integrity_hash = sha256()
  integrity_hash.update(to_hash)
  integrity_check_value = integrity_hash.hexdigest()
  return integrity_check_value

def md5hash(to_hash):
  hash_func = md5()
  hash_func.update(to_hash)
  return hash_func.hexdigest()
