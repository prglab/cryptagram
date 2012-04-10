"""
SeeMeNot setup.py script.
"""

from setuptools import setup

APP = ['code.py']
DATA_FILES = []
OPTIONS = {'argv_emulation': True}

import sys

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
  from cx_Freeze import setup, Executable
  setup(name = "SeeMeNot",
        version = "0.1",
        description = "SeeMeNot: truly private, shareable photos.",
        options = {"build_exe": build_exe_options},
        executables = [Executable("code.py", base=base)])


if sys.platform == 'darwin':
  setup(
    app=APP,
    data_files=DATA_FILES,
    options={'py2app': OPTIONS},
    setup_requires=['py2app'],
    )
