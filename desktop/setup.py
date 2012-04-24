"""
SeeMeNot Desktop setup.py script.
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
  includes = ['Crypto','gflags','PIL']

  # Dependencies are automatically detected, but it might need fine tuning.
  build_exe_options = {"packages": ["os"],
                       "excludes": ["tkinter"],
                       "includes": includes
                       }

  setup(name = "SeeMeNot",
        version = "0.1",
        description = "SeeMeNot: truly private, shareable photos.",
        options = {"build_exe": build_exe_options},
        executables = [Executable("SeeMeNot.py", base=base)])

# Build on Mac OS X.
# python setup.py py2app --no-strip -g -O0
APP = ['SeeMeNot.py']
DATA_FILES = []
OPTIONS = {'argv_emulation': True,
           'iconfile': '/Users/tierney/repos/dnd/wxmac.icns',
           'plist':{'CFBundleIconFile':'wxmac.icns'},
           }

if sys.platform == 'darwin':
  setup(
    app=APP,
    data_files=DATA_FILES,
    options={'py2app': OPTIONS},
    setup_requires=['py2app','pycrypto','python-gflags','PIL'])
