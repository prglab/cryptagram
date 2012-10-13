// Copyright 2012 The Cryptogram Authors. BSD-Style License.

#include "google/logging.h"

namespace cryptogram {

class SymbolSignalCoderInterface {
 public:
  virtual bool SymbolToSignal(const char symbol, int* signal) = 0;
  virtual bool SignalToSymbol(const int signal, char* symbol) = 0;

 private:
  DISALLOW_IMPLICIT_CONSTRUCTORS(SymbolSignalCoderInterface);
};

class MessageSymbolCoderInterface {
 public:
  virtual bool MessageToSymbol(const char message, std::string* symbol) = 0;
  virtual bool SymbolToMessage(const std::string& symbol, char* message) = 0;

 private:
  DISALLOW_IMPLICIT_CONSTRUCTORS(MessageSymbolCoderInterface);
};

class Base64SymbolSignalCoder : public SymbolSignalCoderInterface {
 public:
  Base64SymbolSignalCoder();
  virtual ~Base64SymbolSignalCoder();
  virtual bool SymbolToSignal(const char symbol, int* signal);
  virtual bool SignalToSymbol(const int signal, char* symbol);

 private:
  map<char, int> symbol_to_signal_;
  map<int, char> signal_to_symbol_;

  DISALLOW_COPY_AND_ASSIGN(Base64SymbolSignalCoder);
};

class Base64MessageSymbolCoder : public MessageSymbolCoderInterface {
 public:
  Base64MessageSymbolCoder();
  
 private:
  DISALLOW_COPY_AND_ASSIGN(Base64MessageSymbolCoder);
};

} // namespace cryptogram
