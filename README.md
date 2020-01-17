# logfly

A wrapper over winston to improve usability.

## Features

The logfly module is a wrapper on standard winston package, which exposes three different logger instance to use in the node application.

- Logger: to log developer logs directly from application
- Event-logger: to log for some specific events under specific services to provide extension to other teams.
- Access-logger (Middleware): To intercept request and response, blacklist some fields before logging and log to the file.
- Track logs related to a single request using CLS.

# Install

You can npm install the `logfly` module.

```
npm i logfly --save
```

# Usage

## Initalization

You can intialize the `logfly` module in a separate file passing in the required parameters in the `init` method exposed by that package. Logfly uses a default config and in case config is provided, provided keys takes precedence over used ones.
For Example -

```javascript
const logger = require("./logfly");
const config = {
  eventLogger: {
    filenamePrefix: "events" // Prefix to use for the event logger file.
  },
  accessLogger: {
    logResponseBody: false, //Flag for Access Logger to log response body. Defaults to false
    logRequestBody: false, //Flag for Access Logger to log request body. Defaults to true
    filenamePrefix: "access", // Prefix to use for the access logger file.
    requestWhitelist: [
      "url",
      "headers",
      "method",
      "httpVersion",
      "originalUrl",
      "query",
      "params"
    ], //Whitelist for request fields.
    responseWhitelist: ["_header", "statusCode", "statusMessage"] // Whitelist for response fields.
  },
  logger: {
    filenamePrefix: "dev" // Prefix to use for the Dev logger file
  },
  logDir: "/var/log/sp-logger/", // Directory to store all the logs. Defaults to `/var/log/sp-logger/`
  blackList: ["x-access-token", "u-access-token", "otp", "password"] // Array of strings containing fields to mask.
};
module.exports = logger.init(config);
```

## Dev Logger

```javascript
const logger = require("my-logger.js");
logger.info({
  first: 1,
  second: 2,
  otp: 3423 // will get masked after logging
});
logger.error("Unauthorized transaction");
```

## Event-logger

```javascript
const logger = require("logfly");
const eventLogger = logger.getEventLogger("Order"); // 'Order' is a Service name here to log data related to Orders

eventLogger.log("<EVENT_NAME>", {
  reason: "<REASON>",
  meta: {
    code: "SERVER_ERROR" / "OPS_ERROR",
    description: "<CX_FRIENDLY_DESCRIPTION>"
  }
});
```

# Middlewares

## Access-logger (Middleware)

```javascript
const { accessLoggerMW } = require("my-logger");

const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());
app.use(accessLoggerMW);

app.get("/", function(req, res) {
  res.send("hello world");
});
```

## Request Meta Details (Middleware)

This attaches Request ID and Device ID fields to all the logs.

```javascript
const { addRequestMeta } = require("my-logger");

const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());
app.use(addRequestMeta);

app.get("/", function(req, res) {
  res.send("hello world");
});
```

You can look at implementatin in `metaDetails.js` file.

```javascript

const getReqID = function(req){
  return req.headers.request-id || uuidv1();
};

const getUUID = function(req) {
  if (req._user && req._user.uuid) {
    return req._user.uuid;
  }
  if (req.headers.uuid) {
    return uuid;
  }
  return "NA";
};

addRequestMeta: (req, res, next) => {
    // setting unique request Id for each API request
    apiRequest.run(() => {
      apiRequest.set("reqId", uuidv1());
      apiRequest.set(
        "deviceid",
        req.headers["device-id"] ? req.headers["device-id"] : "NA"
      );
      next();
    });
  },
  addUserDetails: (req, res, next) => {
    userDetails.run(() => {
      userDetails.set("uuid", getUUID(req));
      next();
    });
  }
```

Exposes `reqId` and `deviceId` field to the log.

## User Meta Details (Middleware)

This attaches User ID to all the logs. Can be used to identify logs related to a particular flow.

```javascript
const { addUserDetails } = require("../../utils/my-logger");

const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());
app.use(addUserDetails);

app.get("/", function(req, res) {
  res.send("hello world");
});
```

Exposes `uuid` field to the log.

# Blacklist fields

Following fields will get masked as default after logging. You can pass blacklist fields in the configuration object to overwrite these.

```javascript
["token", "u-access-token", "otp", "password"];
```

# Log-file directory

By default, all the logs will get stored in `/var/log/sp-logger/` folder. Below is file name pattern for every logger.

- access-%DATE%.log
- events-%DATE%.log
- dev-%DATE%.log

# Notes

- Avoid logging sensitive data i.e, otp, tokens, password in the nested level of object.
- When using event logger, enter details in a way which can be easily understood by the CX.

### You can go ahead and ship data to Elasticsearch for further requirements.

Sample filebeat config

```javascript
cloud:
  auth: ${ES_USER}:${ES_PWD}
  id: ${ES_HOST}
filebeat:
  inputs:
  - enabled: true
    json:
      add_error_key: true
      keys_under_root: true
    paths:
    - /mnt/logs/\*.log
    type: log
logging:
  level: debug
output:
  elasticsearch:
    enabled: true
    hosts:
    - ${ES_HOST}
    index: flysvc-%{[agent.version]}-%{+yyyy-MM-dd}
    indices:
    - index: flysvc-access-%{[agent.version]}-%{+yyyy-MM-dd}
      when:
        regexp:
          log:
            file:
              path: access*
    - index: flysvc-dev-%{[agent.version]}-%{+yyyy-MM-dd}
      when:
        regexp:
          log:
            file:
              path: dev*
    - index: flysvc-events-%{[agent.version]}-%{+yyyy-MM-dd}
      when:
        regexp:
          log:
            file:
              path: events*
    password: ${ES_PWD}
    protocol: https
    username: ${ES_USER}

```
