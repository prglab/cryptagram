#!/bin/sh

autoreconf --install -v
automake -v --add-missing --copy >/dev/null 2>&1
