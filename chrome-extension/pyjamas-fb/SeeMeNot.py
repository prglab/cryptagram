from pyjamas import DOM
from pyjamas.ui.Sink import SinkList
from pyjamas.Timer import Timer
from pyjamas.Canvas import GWTCanvas

import Menus

from ImageCoder import Base64MessageSymbolCoder, Base64SymbolSignalCoder
import SymbolShape

from __pyjamas__ import doc, wnd, JS
from __javascript__ import Array

# TODO(tierney): Set context menu directly in extension javascript. Then we poll
# for the proper alt text tag in order to identify the pictures to manipulate.

def _base64_pad(s):
  mod = len(s) % 4
  if mod == 0:
    return s
  return s + (4 - mod) * '='


class SeeMeNot(object):
  def __init__(self, symbol_shape, message_symbol_coder, symbol_signal_coder):
    self.timer = Timer(notify=self)
    self.setTimer(self.timer)
    self.symbol_shape = symbol_shape
    self.message_symbol_coder = message_symbol_coder
    self.symbol_signal_coder = symbol_signal_coder
    self.decoded = {}

  def setTimer(self, timer):
    self.timer.schedule(2000)

  def onTimer(self, timer):
    print 'onTimer Called.'
    JS("""
var myinfoobject = new Object();
myinfoobject['populate'] = true;
chrome.windows.getCurrent(myinfoobject, mylocalfunction);
function mylocalfunction(window) {
  @{{focused_window}} = window.id;
  tabs = window.tabs;
  if (!tabs) {
    return;
  }
  tabs_len = tabs.length;
  for (var i = 0; i < tabs_len; i++) {
    if (tabs[i].active) {
      @{{focused_tab}} = tabs[i].id

      console.log("Issuing getDom request to " + tabs[i].id);
      chrome.tabs.sendRequest(tabs[i].id, {action: "getDOM"},
        function(response) {
          if (!response.process) {
            console.log('Nothing to process.');
            return;
          }
          console.log("SeeMeNot Response from python " + response.dom.substr(0,8));

          var canvas = document.createElement('canvas');
          var ctx = canvas.getContext('2d');
          var img = new Image();

          img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);

            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            console.log('canvas ' + canvas.width + ' ' + canvas.height);
            @{{width}} = imageData.width;
            @{{height}} = imageData.height;
            var datalength = imageData.data.length;

            @{{imageDataArray}} = new Array();
            for (var j = 0; j < datalength; j++) {
              @{{imageDataArray}}.push(imageData.data[j]);
            }
          }

          img.src = response.dom;
          @{{b64}} = response.dom;
        }
      );
    }
  }
}""")
    print 'Focused win:', focused_window
    print 'Focused tab:', focused_tab
    print "Target py'd:", str(b64)[:min(40, len(str(b64)))]

    new_b64 = str(b64)

    symbol_signal_coder = Base64SymbolSignalCoder()
    if str(focused_tab) and str(new_b64) and str(width):
      print 'Dimensions', width, height

      _data_len = len(imageDataArray)
      imageDataArray.reverse()

      pixels = []
      for _h in range(height):
        pixels.append([])
        for _w in range(width):
          red, green, blue, white = (
            imageDataArray.pop(), imageDataArray.pop(), imageDataArray.pop(),
            imageDataArray.pop())
          pixels[_h].append((red, green, blue))

      print 'Pixel matrix set.'
      shape_width, shape_height = self.symbol_shape.get_shape_size()
      extracted_data = ''
      for y_coord in range(0, height, shape_height):
        for x_coord in range(0, width, shape_width):
          values = {}
          for symbol_val in range(self.symbol_shape.get_num_symbol_shapes()):
            coords = self.symbol_shape.get_symbol_shape_coords(symbol_val+1)
            values[symbol_val] = {}
            for x,y in coords:
              values[symbol_val][(x,y)] = pixels[y_coord + y][x_coord + x]

          _symbol = self.symbol_signal_coder.signal_to_symbol(values)
          extracted_datum = self.message_symbol_coder.symbol_to_message(_symbol)
          extracted_data += extracted_datum

      extracted_data = _base64_pad(extracted_data)

      print 'Submitting extracted_data.'
      if not extracted_data in self.decoded:
        self.decoded[extracted_data] = True
        JS("""
chrome.tabs.sendRequest(@{{focused_tab}}, {action: "decrypted", data: @{{extracted_data}}},
  function(response) {
    console.log("Success");
  }
);
""")
      else:
        print 'Already sent for decoding.'
    self.timer.schedule(1000)

  def onModuleLoad(self):
    self.sink_list = SinkList()
    self.sink_list.add(Menus.init())

if __name__=='__main__':
  app = SeeMeNot(SymbolShape.two_by_four,
                 Base64MessageSymbolCoder(),
                 Base64SymbolSignalCoder())
