"""
Cryptogram Desktop setup.py script.
"""
import sys
from setuptools import setup

# GUI applications require a different base on Windows (the default is for a
# console application).
base = None
if sys.platform == "win32":
  base = "Win32GUI"

# Build on Linux or Windows.
if sys.platform in ['linux2', 'win32']:
  from cx_Freeze import setup, Executable
  copyDependentFiles = True
  includes = ['Crypto','gflags','PIL','PyV8', 'Tkinter','encodings']

  # Dependencies are automatically detected, but it might need fine tuning.
  build_exe_options = {"packages": ["os"],
                       "includes": includes
                       }

  setup(name = "Cryptogram",
        version = "0.1",
        description = "Cryptogram: private, shareable photos.",
        options = {"build_exe": build_exe_options},
        executables = [Executable("Cryptogram.py", base=base)])

# Build on Mac OS X.
# python setup.py py2app --no-strip -g -O0
APP = ['Cryptogram.py']
DATA_FILES = ['sjcl.js']
OPTIONS = {'argv_emulation': True,
           'iconfile': 'icon.icns',
           'plist':{'CFBundleIconFile':'icon.icns'},
           'includes':['Tkinter','PyV8'],
           }

if sys.platform == 'darwin':
  setup(
    app=APP,
    data_files=DATA_FILES,
    options={'py2app': OPTIONS},
    setup_requires=['py2app'])
