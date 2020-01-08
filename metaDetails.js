"use strict";

const uuidv1 = require("uuid/v1");
const createNamespace = require("continuation-local-storage").createNamespace;
const apiRequest = createNamespace("slicepay-node-application");
const userDetails = createNamespace("slicepay-userDetails");

const getUUID = function(req) {
  if (req._user && req._user.uuid) {
    return req._user.uuid;
  }
  if (req.headers.uuid) {
    return uuid;
  }
  return "NA";
};

const getReqID = function(req) {
  return req.headers["request-id"] || uuidv1();
};

module.exports = {
  addRequestMeta: (req, res, next) => {
    // setting unique request Id for each API request
    // TODO : use request-id from header if exist, otherwise generate new uuid
    apiRequest.run(() => {
      apiRequest.set("reqId", getReqID(req));
      apiRequest.set(
        "deviceid",
        req.headers["sp-device-id"] ? req.headers["sp-device-id"] : "NA"
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
};
