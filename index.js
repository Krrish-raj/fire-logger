"use strict";

// const logger = require('./logger.js');
const Logger = require("./logger");
// const AccessLoggerMiddleware = require("./accessLoggerMiddleware");
const AccessLoggerMiddleware = require("./accessLoggerMiddleware");
const DEFAULT_CONFIG = require("./config");
var metaDetails = require("./metaDetails");
const merge = require("lodash.merge");

module.exports = {
  /**
   * @typedef EventLoggerConfig
   * @property {string} filenamePrefix File Name prefix for event based logs
   */
  /**
   * @typedef AccessLoggerConfig
   * @property {string} filenamePrefix File Name prefix for Access based logs
   * @property {boolean} logResponseBody True/False : to log response body or not. Defaults to True
   * @property {boolean} logRequestBody True/False : to log request body or not. Defaults to True
   * @property {string[]} requestWhitelist Array of strings containing request fields to show/whitelist in logs.
   * @property {string[]} responseWhitelist Array of strings containing response fields to show/whitelist in logs.
   */
  /**
   * @typedef LoggerConfig
   * @property {string} filenamePrefix File Name prefix for Normal Logger based logs
   */
  /**
   * @typedef Configuration
   * @property {EventLoggerConfig} eventLogger Event Logger Configuration
   * @property {AccessLoggerConfig} accessLogger Access Logger Configurations
   * @property {LoggerConfig} logger Normal Logger Configurations
   * @property {string} logDir path to store the logs. Default to '/var/log/sp-logger/'
   * @property {string[]} blackList Array of string to blackList in Request/Response logs.
   */
  /**
   * Initialize Logger with Configuration Objects
   * @param {Configuration} [config]
   */
  init: function(config) {
    if (config) merge(DEFAULT_CONFIG, config);
    const logger = new Logger(DEFAULT_CONFIG);
    const accessLoggerMiddleware = new AccessLoggerMiddleware(
      logger,
      DEFAULT_CONFIG.accessLogger
    );

    var toExport = logger.logger;
    toExport.getEventLogger = logger.getEventLogger.bind(logger);
    toExport.getAccessLogger = logger.getAccessLogger.bind(logger);
    toExport.getAccessLoggerMW = accessLoggerMiddleware.accessLoggerMiddleware;
    toExport.addRequestMeta = metaDetails.addRequestMeta;
    toExport.addUserDetails = metaDetails.addUserDetails;

    return toExport;
  }
};
