# sp-uni-logger

The sp-uni-logger module is a wrapper on standard winston package, which exposes three different logger instance to use in the node application.

- Logger: to log developer logs directly from application
- Event-logger: to log for some specific events under specific services.
- Access-logger (Middleware): To intercept request and response, blacklist some fields before logging and log to the file

# Install
You can npm install the `sp-uni-logger` module.
```
npm i sp-uni-logger --save
```
# Usage

## Initalization

You can intialize the `sp-uni-logger` module in a separate file passing in the required parameters in the `init` method exposed by tht package.
For Example -

```javascript
const splogger = require("./index");
const config = {
  eventLogger: {
    filenamePrefix: "events" // Prefix to use for the event logger file.
  },
  accessLogger: {
    logResponseBody: false, //Flag for Access Logger to log response body. Defaults to true
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
module.exports = splogger.init(config);
```

## Dev Logger

```javascript
const splogger = require("../../utils/splogger");
splogger.info({
  first: 1,
  second: 2,
  otp: 3423 // will get masked after logging
});
splogger.error("Unauthorized transaction");
```

## Event-logger

```javascript
const splogger = require('../../utils/splogger');
const eventLogger = splogger.getEventLogger('Order'); // 'Order' is a Service name here to log data related to Orders

eventLogger.log("<EVENT_NAME>",{  
                                  reason :"<REASON>", 
                                  meta : {
                                    code: "SERVER_ERROR" / "OPS_ERROR",
                                    description: "<CX_FRIENDLY_DESCRIPTION>"
                                  } 
                               }
);
```
# Middlewares 
## Access-logger (Middleware)

```javascript
const { accessLoggerMW } = require("../../utils/splogger");;

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
const { addRequestMeta } = require("../../utils/splogger");

const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());
app.use(addRequestMeta);

app.get("/", function(req, res) {
  res.send("hello world");
});
```
Exposes `reqId` and `deviceId` field to the log.

## User Meta Details (Middleware)
This attaches User ID to all the logs. Can be used to identidy events by a single user.

```javascript
const { addUserDetails } = require("../../utils/splogger");

const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());
app.use(addUserDetails);

app.get("/", function(req, res) {
  res.send("hello world");
});
```
Exposes `userID` field to the log.

# Blacklist fields

Following fields will get masked as default after logging. You can pass blacklist fields in the configuration object to overwrite these.

```javascript
["token", "u-access-token", "otp", "password"];
```

# Log-file directory

By default, all the logs will get stored in `/var/log/sp-logger/` folder. Below is file name pattern for every logger.

- access-%DATE%.log
- events-%DATE%.log
- sp-service-%DATE%.log

# Notes

- Avoid logging sensitive data i.e, otp, tokens, password in the nested level of object.
- When using event logger, enter details in a way which can be easily understood by the CX.