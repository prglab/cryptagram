// Copyright 2012 The Cryptagram Authors. All Rights Reserved.

goog.provide('cryptagram.RemoteLog');

goog.require('goog.debug.LogManager');
goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');
goog.require('goog.debug.TextFormatter');

cryptagram.RemoteLog = function() {
  this.publishHandler_ = goog.bind(this.addLogRecord, this);

  /**
   * Formatter for formatted output.
   * @type {!goog.debug.TextFormatter}
   * @private
   */
  this.formatter_ = new goog.debug.TextFormatter();
  this.formatter_.showAbsoluteTime = false;
  this.formatter_.showExceptionText = false;

  this.isCapturing_ = false;
  this.logBuffer_ = '';

  /**
   * Loggers that we shouldn't output.
   * @type {!Object.<boolean>}
   * @private
   */
  this.filteredLoggers_ = {};
};

cryptagram.RemoteLog.prototype.logger = 
    goog.debug.Logger.getLogger('cryptagram.RemoteLog');


/**
 * Returns the text formatter used by this remote log
 * @return {!goog.debug.TextFormatter} The text formatter.
 */
cryptagram.RemoteLog.prototype.getFormatter = function() {
  return this.formatter_;
};

/**
 * Sets whether we are currently capturing logger output.
 * @param {boolean} capturing Whether to capture logger output.
 */
cryptagram.RemoteLog.prototype.setCapturing = function(capturing) {
  if (capturing == this.isCapturing_) {
    return;
  }
  this.logger.info("Remote Capture: " + capturing);

  // attach or detach handler from the root logger
  var rootLogger = goog.debug.LogManager.getRoot();
  if (capturing) {
    rootLogger.addHandler(this.publishHandler_);
  } else {
    rootLogger.removeHandler(this.publishHandler_);
    this.logBuffer = '';
  }
  this.isCapturing_ = capturing;
};

/**
 * Adds a log record.
 * @param {goog.debug.LogRecord} logRecord The log entry.
 */
cryptagram.RemoteLog.prototype.addLogRecord = function(logRecord) {

  // Check to see if the log record is filtered or not.
  if (this.filteredLoggers_[logRecord.getLoggerName()]) {
    return;
  }

  var record = this.formatter_.formatRecord(logRecord);
  var host = cryptagram.RemoteLog.host_;
  if (host) {
    // Remotely log SEVERE and SHOUT
    if (logRecord.getLevel() >= goog.debug.Logger.Level.SEVERE) {
      cryptagram.RemoteLog.logToRemoteLog_(host, 'info', record);
    }
  } else if (window.opera) {
    // window.opera.postError is considered an undefined property reference
    // by JSCompiler, so it has to be referenced using array notation instead.
    window.opera['postError'](record);
  } else {
    this.logBuffer_ += record;
  }
};

/**
 * Adds a logger name to be filtered.
 * @param {string} loggerName the logger name to add.
 */
cryptagram.RemoteLog.prototype.addFilter = function(loggerName) {
  this.filteredLoggers_[loggerName] = true;
};


/**
 * Removes a logger name to be filtered.
 * @param {string} loggerName the logger name to remove.
 */
cryptagram.RemoteLog.prototype.removeFilter = function(loggerName) {
  delete this.filteredLoggers_[loggerName];
};


/**
 * Global remote log logger instance
 * @type {cryptagram.RemoteLog}
 */
cryptagram.RemoteLog.instance = null;

/**
 * The remote log to which to log.  This is a property so it can be mocked out in
 * unit testing.
 * @type {Object}
 * @private
 */
cryptagram.RemoteLog.host_ = "cryptagr.am";


/**
 * Install the remote log and start capturing if "Debug=true" is in the page URL
 */
cryptagram.RemoteLog.autoInstall = function() {
  if (!cryptagram.RemoteLog.instance) {
    cryptagram.RemoteLog.instance = new cryptagram.RemoteLog();
  }

  if (window.location.href.indexOf('Debug=true') != -1) {
    cryptagram.RemoteLog.instance.setCapturing(true);
  }
};


/**
 * Show an alert with all of the captured debug information.
 * Information is only captured if remote log is not available
 */
cryptagram.RemoteLog.show = function() {
  alert(cryptagram.RemoteLog.instance.logBuffer_);
};


/**
 * Logs the record to the remote log using the given function.  If the function
 * is not available on the remote log object, the log function is used instead.
 * @param {string} remote log The remote log host .
 * @param {string} fnName The name of the function to use.
 * @param {string} record The record to log.
 * @private
 */
cryptagram.RemoteLog.logToRemoteLog_ = function(host, fnName, record) {
/* Working solution but causes warning messages that we may want to avoid. */
  var img = new Image();
  img.src = "http://" + host + 
            "?sev=" + encodeURIComponent(fnName) + 
            "&msg=" + encodeURIComponent(record);

  /*var xhr = new XMLHttpRequest();
  var url = "http://" + host;
  var params = "sev=" + encodeURIComponent(fnName) + 
               "&msg=" + encodeURIComponent(record);
  xhr.open("POST", url, true);
  xhr.send(params);*/
};
