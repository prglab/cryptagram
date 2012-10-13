#include "Coder.h"

namespace cryptogram {

Base64SymbolSignalCoder::Base64SymbolSignalCoder() {
  symbol_to_signal_['0'] = 238;
  symbol_to_signal_['1'] = 210;
  symbol_to_signal_['2'] = 182;
  symbol_to_signal_['3'] = 154;
  symbol_to_signal_['4'] = 126;
  symbol_to_signal_['5'] = 98;
  symbol_to_signal_['6'] = 70;
  symbol_to_signal_['7'] = 42;
  symbol_to_signal_['8'] = 14;

  signal_to_symbol_[238] = '0';
  signal_to_symbol_[210] = '1';
  signal_to_symbol_[182] = '2';
  signal_to_symbol_[154] = '3';
  signal_to_symbol_[126] = '4';
  signal_to_symbol_[98] = '5';
  signal_to_symbol_[70] = '6';
  signal_to_symbol_[42] = '7';
  signal_to_symbol_[14] = '8';
};

Base64SymbolSignalCoder::~Base64SymbolSignalCoder() {
}

int Base64SymbolSignalCoder::SymbolToSignal(const char symbol) {
  return symbol_to_signal_[symbol];
}

char Base64SymbolSignalCoder::SignalToSymbol(const int signal) {
  return 0;
}

} // namespace cryptogram
