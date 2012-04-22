#!/usr/bin/env python

# Converts pyjamas-generated html code into more cleanly separated html and
# javascript.

import os
import sys
import re
from bs4 import BeautifulSoup

filename = sys.argv[1]

class PostProcessPyjamas(object):
  to_relocate = []
  new_html = []
  script_count = 0

  def __init__(self, filename):
    self.filename = filename

  def _process_body_onload(self, line):
    matches = re.search('<body onload="(.*)">', line)
    js = matches.groups()[0]

    base_name = os.path.basename(self.filename)
    function_name = base_name.replace('.','') + 'Init'
    body_js_to_write = 'function %s() { %s }\nwindow.onload=%s' % (
      function_name, js, function_name)


    body_filename = self.filename + '-body.js'
    with open(body_filename, 'w') as fh:
      fh.write(body_js_to_write)

    self.new_html.append('<body>')
    self.new_html.append('<script src="%s"></script>' % \
                           os.path.basename(body_filename))

  def rewrite(self):
    # Read file.
    with open(self.filename) as fh:
      _lines = fh.read()
      # lines = [line.strip() for line in fh.readlines()]
    soup = BeautifulSoup(_lines)
    _lines = soup.prettify(formatter=None)
    lines = [line.strip() for line in _lines.split('\n')]

    in_script = False
    for line in lines:
      if not in_script and line.startswith('<script') and \
            not 'src=' in line:
        self.script_count += 1
        in_script = True
        continue

      if in_script and line.find('</script>') >= 0:
        in_script = False

        script_name = '%s-%02d.js' % (self.filename, self.script_count)
        with open(script_name, 'w') as fh:
          fh.write('\n'.join(self.to_relocate))
        self.to_relocate = []
        self.new_html.append(
          '<script src="%s"></script>' % os.path.basename(script_name))

        new_line = line.replace('</script>','')
        if new_line.startswith('<body onload'):
          self._process_body_onload(new_line)
        else:
          self.new_html.append(new_line)
        continue

      if in_script:
        if line in ['<!--', '-->']:
          continue

        self.to_relocate.append(line)
        continue

      if line == '</head>' and 'cache' not in self.filename:
        self.new_html.append(
          '<script type="text/javascript" src="background.js"></script>')
        self.new_html.append(line)
        continue

      if line.startswith('<body onload'):
        self._process_body_onload(line)
        continue

      self.new_html.append(line)

    with open(self.filename, 'w') as fh:
      fh.write('\n'.join(self.new_html))

    # print '\n'.join(self.new_html)

ppp = PostProcessPyjamas(filename)
ppp.rewrite()
