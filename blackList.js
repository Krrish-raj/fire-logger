"use strict";

const { format } = require("winston");
// const blackList = require('./config.js')['blackList'];

const getNamespace = require("continuation-local-storage").getNamespace;

const safeJSONParse = string => {
  try {
    return JSON.parse(string);
  } catch (e) {
    return string;
  }
};

const blackListTheData = (logObject, blackList) => {
  if (
    logObject &&
    typeof logObject === "object" &&
    logObject.constructor === Object
  ) {
    (blackList || []).map(key => {
      if (logObject[key]) logObject[key] = "**masked**";
    });
  }
};

module.exports = blackList =>
  format((info, opts) => {
    let infoData = safeJSONParse(info);
    let messageData = safeJSONParse(info.message);
    let requestData = safeJSONParse(info.request);
    let responseData = safeJSONParse(info.response);

    [
      infoData,
      // remove from parent level
      messageData,
      // remove from access log
      (requestData || {}).headers || {},
      (requestData || {}).body || {},
      (responseData || {}).body || {}
    ].forEach(each => {
      blackListTheData(each, blackList);
    });

    const apiRequest = getNamespace("slicepay-node-application");
    const userDetails = getNamespace("slicepay-userDetails");
    info["reqId"] =
      apiRequest && apiRequest.get("reqId")
        ? apiRequest.get("reqId")
        : "not_found";
    info["deviceId"] =
      apiRequest && apiRequest.get("deviceid")
        ? apiRequest.get("deviceid")
        : "not_found";
    info["uuid"] =
      userDetails && userDetails.get("uuid")
        ? userDetails.get("uuid")
        : "not_found";
    info.message = messageData;
    if (info.request) {
      info.request.body = JSON.stringify(info.request.body);
    }
    info.response = { data: JSON.stringify(info.response) };
    return info;
  });
