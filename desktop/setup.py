#!/usr/bin/env python

import sys
from cx_Freeze import setup, Executable

# Dependencies are automatically detected, but it might need fine tuning.
build_exe_options = {"packages": ["os"],
                     "excludes": ["tkinter"],
                     }

# GUI applications require a different base on Windows (the default is for a
# console application).
base = None
if sys.platform == "win32":
  base = "Win32GUI"

if sys.platform in ['linux2', 'win32']:
  setup(name = "SeeMeNot",
        version = "0.1",
        description = "SeeMeNot: truly private, shareable photos.",
        options = {"build_exe": build_exe_options},
        executables = [Executable("code.py", base=base)])

if sys.platform == 'darwin':
  from setuptools import setup
  setup(
    app = ['code.py'],
    setup_requires = ['py2app'],
)
