"use strict";

// const defaultConfig = require("./config");
const blackList = require("./blackList.js");
const winston = require("winston");
const { combine, timestamp, label, printf, prettyPrint } = winston.format;
const DailyRotateFile = require("winston-daily-rotate-file");

const createDailyRotateTransport = function(fileName) {
  return new DailyRotateFile({
    filename: `${fileName}-%DATE%.log`,
    datePattern: "DD-MM-YYYY",
    zippedArchive: true,
    level: "info",
    maxFiles: "14d"
  });
};

const createLogger = function(config, type) {
  const supportedTypes = ["accessLogger", "eventLogger", "logger"];
  if (supportedTypes.indexOf(type) == -1) {
    throw new Error(
      `Invalid logger type, expecting one of ${supportedTypes.join(
        ","
      )}, got ${type}`
    );
  }

  const logDir = config.logDir;
  const loggerConfig = config[type];
  const transports = [
    createDailyRotateTransport(logDir + loggerConfig.filenamePrefix)
  ];

  if (config.logConsole) {
    transports.push(
      new winston.transports.Console({
        format: combine(prettyPrint())
      })
    );
  }

  let Bl = blackList(config.blackList);
  const format = winston.format.combine(
    Bl(),
    winston.format.timestamp(),
    winston.format.json()
  );

  return winston.createLogger({
    level: loggerConfig.logLevel || "info",
    transports,
    format
  });
};

const getEventMeta = (feature) => {
  const x = require("cls-hooked").getNamespace(
    "slicepay-serviceMetaDetails"
  );
  const serviceMeta = {};
  if (feature) serviceMeta.feature = feature;
  serviceMeta["service"] = x && x.get("service");
  serviceMeta["action"] = x && x.get("action");
  return serviceMeta;
};

class Logger {
  constructor(config) {
    this.eventLogger = createLogger(config, "eventLogger");
    this.accessLogger = createLogger(config, "accessLogger");
    this.logger = createLogger(config, "logger");
  }

  //getEventLogger
  /**
   *
   * @param {string} feature feature of the event - if available
   * @returns {Object}
   */
  getEventLogger(feature) {
    return {
      type: "eventLogger",
      /**
       * @param {string} eventTag // EVENT_DESCRIPTION
       * @param {object} data // EVENT_DESCRIPTION
       */
      log: function(eventTag, data) {
        if (!eventTag || typeof eventTag !== "string") {
          throw new Error("Please enter a valid event tag");
        }
        eventTag = eventTag.replace(/ /g, "_").toUpperCase();
        if (typeof data != "object" || Array.isArray(data)) {
          data = { data };
        }
        const dataToLog = Object.assign({}, data, getEventMeta(feature));
        this.eventLogger.info(eventTag, dataToLog);
      }.bind(this),
      error: function(eventTag, data) {
        if (!eventTag || typeof eventTag !== "string") {
          throw new Error("Please enter a valid event tag");
        }
        eventTag = eventTag.replace(/ /g, "_").toUpperCase();
        if (typeof data != "object" || Array.isArray(data)) {
          data = { data };
        }
        const dataToLog = Object.assign({}, data, getEventMeta(feature));
        this.eventLogger.error(eventTag, dataToLog);
      }.bind(this),
      info: function(eventTag, data) {
        if (!eventTag || typeof eventTag !== "string") {
          throw new Error("Please enter a valid event tag");
        }
        eventTag = eventTag.replace(/ /g, "_").toUpperCase();
        if (typeof data != "object" || Array.isArray(data)) {
          data = { data };
        }
        const dataToLog = Object.assign({}, data, getEventMeta(feature));
        this.eventLogger.info(eventTag, dataToLog);
      }.bind(this)
    };
  }

  getAccessLogger() {
    return this.accessLogger;
  }

  getLogger() {
    return this.logger;
  }
}

module.exports = Logger;

// create singleton for logger
// var logger = new Logger();

// var toExport = logger.logger;
// toExport.getEventLogger = logger.getEventLogger .bind(logger);
// toExport.getAccessLogger = logger.getAccessLogger.bind(logger);
// module.exports = toExport;
