// Copyright 2012 The Cryptogram Authors. BSD-Style License.

#include <map>

#include "basictypes.h"
#include "glog/logging.h"

namespace cryptogram {

class SymbolSignalCoderInterface {
 public:
  virtual ~SymbolSignalCoderInterface();
  virtual int SymbolToSignal(const char symbol) = 0;
  virtual char SignalToSymbol(const int signal) = 0;
};

class MessageSymbolCoderInterface {
 public:
  virtual ~MessageSymbolCoderInterface();
  virtual bool MessageToSymbol(const char message, std::string* symbol) = 0;
  virtual bool SymbolToMessage(const std::string& symbol, char* message) = 0;
};

class Base64SymbolSignalCoder : public SymbolSignalCoderInterface {
 public:
  Base64SymbolSignalCoder();
  virtual ~Base64SymbolSignalCoder();
  virtual int SymbolToSignal(const char symbol);
  virtual char SignalToSymbol(const int signal);

 private:
  std::map<char, int> symbol_to_signal_;
  std::map<int, char> signal_to_symbol_;

  DISALLOW_COPY_AND_ASSIGN(Base64SymbolSignalCoder);
};

class Base64MessageSymbolCoder : public MessageSymbolCoderInterface {
 public:
  Base64MessageSymbolCoder();
  virtual ~Base64MessageSymbolCoder();
  
 private:
  DISALLOW_COPY_AND_ASSIGN(Base64MessageSymbolCoder);
};

} // namespace cryptogram
