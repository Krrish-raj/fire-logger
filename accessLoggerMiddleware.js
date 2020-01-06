"use strict";

var logger, config;
class AccessLoggerMiddleware {
  constructor(loggerIn, configIn) {
    logger = loggerIn;
    config = configIn;
  }
  accessLoggerMiddleware(req, res, next) {
    try {
      const accessLogger = logger.getAccessLogger();
      const profiler = accessLogger.startTimer();

      let level = "info";
      let meta = {};

      let end = res.end;
      res.end = (chunk, encoding) => {
        res.end = end;
        res.end(chunk, encoding);

        let reqResData = {};

        reqResData.request = formatRequest(req);
        reqResData.response = formatResponse(res, chunk);

        profiler.done(level, {
          ...reqResData,
          meta,
          ...{ message: "access_log" }
        });
      };
      next();
    } catch (error) {
      console.log("error::", error);
      next();
    }
  }
}

module.exports = AccessLoggerMiddleware;

function formatRequest(req) {
  let request = {};

  (config.requestWhitelist || []).forEach(key => {
    request[key] = req[key];
  });

  request["ip"] =
    req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.connection.remoteAddress;

  request['url_details'] = {};
  request.url_details.path = request.originalUrl.split("?")[0];
  request.url_details.query = request.originalUrl.split("?")[1];

  if (config.logRequestBody) request["body"] = req["body"];

  return request;
}

function formatResponse(res, chunk) {
  let response = {};

  (config.responseWhitelist || []).map(key => {
    response[key] = res[key];
  });

  if (res._hasBody && config.logResponseBody) {
    let isJson =
      res.getHeader("content-type") &&
      res.getHeader("content-type").indexOf("json") >= 0;
    response.body = bodyToString(chunk, isJson);
  }

  return response;
}

const bodyToString = (body, isJSON) => {
  let stringBody = body && body.toString();
  if (isJSON) {
    return safeJSONParse(body) || stringBody;
  }
  return stringBody;
};

const safeJSONParse = string => {
  try {
    return JSON.parse(string);
  } catch (e) {
    return undefined;
  }
};
