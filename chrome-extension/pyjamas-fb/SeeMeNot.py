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
            for (var j = 0; j < datalength; j = j + 4) {
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

    JS("""
@{{lookup}} = { 255: 0, 254: 0, 253: 0, 252: 0, 251: 0, 250: 0, 249: 0, 248: 0, 247: 0, 246: 0, 249: 0, 248: 0, 247: 0, 246: 0, 245: 0, 244: 0, 243: 0, 242: 0, 241: 0, 240: 0, 239: 0, 238: 0, 237: 0, 236: 0, 235: 0, 234: 0, 233: 0, 232: 0, 231: 0, 230: 0, 229: 0, 228: 0, 227: 0, 226: 0, 225: 0, 224: 0, 223: 0, 222: 0, 221: 1, 220: 1, 219: 1, 218: 1, 217: 1, 216: 1, 215: 1, 214: 1, 213: 1, 212: 1, 211: 1, 210: 1, 209: 1, 208: 1, 207: 1, 206: 1, 205: 1, 204: 1, 203: 1, 202: 1, 201: 1, 200: 1, 199: 1, 198: 1, 197: 1, 196: 1, 195: 1, 194: 1, 193: 2, 192: 2, 191: 2, 190: 2, 189: 2, 188: 2, 187: 2, 186: 2, 185: 2, 184: 2, 183: 2, 182: 2, 181: 2, 180: 2, 179: 2, 178: 2, 177: 2, 176: 2, 175: 2, 174: 2, 173: 2, 172: 2, 171: 2, 170: 2, 169: 2, 168: 2, 167: 2, 166: 2, 165: 3, 164: 3, 163: 3, 162: 3, 161: 3, 160: 3, 159: 3, 158: 3, 157: 3, 156: 3, 155: 3, 154: 3, 153: 3, 152: 3, 151: 3, 150: 3, 149: 3, 148: 3, 147: 3, 146: 3, 145: 3, 144: 3, 143: 3, 142: 3, 141: 3, 140: 3, 139: 3, 138: 3, 137: 4, 136: 4, 135: 4, 134: 4, 133: 4, 132: 4, 131: 4, 130: 4, 129: 4, 128: 4, 127: 4, 126: 4, 125: 4, 124: 4, 123: 4, 122: 4, 121: 4, 120: 4, 119: 4, 118: 4, 117: 4, 116: 4, 115: 4, 114: 4, 113: 4, 112: 4, 111: 4, 110: 4, 109: 5, 108: 5, 107: 5, 106: 5, 105: 5, 104: 5, 103: 5, 102: 5, 101: 5, 100: 5, 99: 5, 98: 5, 97: 5, 96: 5, 95: 5, 94: 5, 93: 5, 92: 5, 91: 5, 90: 5, 89: 5, 88: 5, 87: 5, 86: 5, 85: 5, 84: 5, 83: 5, 82: 5, 81: 6, 80: 6, 79: 6, 78: 6, 77: 6, 76: 6, 75: 6, 74: 6, 73: 6, 72: 6, 71: 6, 70: 6, 69: 6, 68: 6, 67: 6, 66: 6, 65: 6, 64: 6, 63: 6, 62: 6, 61: 6, 60: 6, 59: 6, 58: 6, 57: 6, 56: 6, 55: 6, 54: 6, 53: 7, 52: 7, 51: 7, 50: 7, 49: 7, 48: 7, 47: 7, 46: 7, 45: 7, 44: 7, 43: 7, 42: 7, 41: 7, 40: 7, 39: 7, 38: 7, 37: 7, 36: 7, 35: 7, 34: 7, 33: 7, 32: 7, 31: 7, 30: 7, 29: 7, 28: 7, 27: 7, 26: 7, 25: 8, 24: 8, 23: 8, 22: 8, 21: 8, 20: 8, 19: 8, 18: 8, 17: 8, 16: 8, 15: 8, 14: 8, 13: 8, 12: 8, 11: 8, 10: 8, 9: 8, 8: 8, 7: 8, 6: 8, 5: 8, 4: 8, 3: 8, 2: 8, 1: 8, 0: 8 }
""")

    symbol_signal_coder = Base64SymbolSignalCoder()
    if str(focused_tab) and str(new_b64) and str(width):
      print 'Dimensions', width, height

      _data_len = len(imageDataArray)
      imageDataArray.reverse()

      pixels = []
      for _h in range(height):
        pixels.append([])
        for _w in range(width):
          red = imageDataArray.pop()
          pixels[_h].append(red)

      print 'Pixel matrix set.'
      shape_width, shape_height = self.symbol_shape.get_shape_size()
      extracted_data = ''
      values = {}
      for y_coord in range(0, height, shape_height):
        for x_coord in range(0, width, shape_width):
          values.clear()
          _symbol = []
          for symbol_val in range(self.symbol_shape.get_num_symbol_shapes()):
            coords = self.symbol_shape.get_symbol_shape_coords(symbol_val+1)
            _vals = 0
            _num_vals = 0

            for x,y in coords:
              _vals += pixels[y_coord + y][x_coord + x]
              _num_vals += 1
            _avg = int(_vals / float(_num_vals))
            JS("@{{_symbol_val}} = @{{lookup}}[@{{_avg}}]")
            _symbol.append(int(_symbol_val))

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
  app = SeeMeNot(SymbolShape.two_square,
                 Base64MessageSymbolCoder(),
                 Base64SymbolSignalCoder())
