"use strict";

const uuidv4 = require("uuid/v4");
const createNamespace = require("continuation-local-storage").createNamespace;
const apiRequest = createNamespace("slicepay-node-application");
const userDetails = createNamespace("slicepay-userDetails");

module.exports = {
  addRequestMeta: (req, res, next) => {
    // setting unique request Id for each API request
    // TODO : use request-id from header if exist, otherwise generate new uuid
    apiRequest.run(() => {
      apiRequest.set("reqId", uuidv4());
      apiRequest.set(
        "deviceid",
        req.headers["sp-device-id"] ? req.headers["sp-device-id"] : "NA"
      );
      next();
    });
  },
  addUserDetails: (req,res,next)=>{
    userDetails.run(() => {
      userDetails.set("userID",req._user ? req._user.uuid : "NA");
      userDetails.set("uuid", req.headers.uuid ? req.headers.uuid : "NA");
      next();
    });
  },
};
