"use strict";
// holds default config for the logger module

const isProduction = process.env.NODE_ENV === "production" ? true : false;
const logLevel = process.env.logLevel || ((isProduction && "error") || "info");
const logConsole =
  process.env.logConsole == "true" || (isProduction ? false : true);

const config = {
  eventLogger: {
    filenamePrefix: "events"
  },
  accessLogger: {
    filenamePrefix: "access",
    logResponseBody: true,
    logRequestBody: true,
    requestWhitelist: [
      "url",
      "headers",
      "method",
      "httpVersion",
      "originalUrl",
      "query",
      "params"
    ],
    responseWhitelist: ["_header", "statusCode", "statusMessage"]
  },
  logger: {
    filenamePrefix: "sp-service",
    logLevel
  },
  logConsole,
  logDir: "/var/log/sp-logger/",
  // logDir: './',
  blackList: ["u-access-token", "otp", "password"]
};

module.exports = config;
