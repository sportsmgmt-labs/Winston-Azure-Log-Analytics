var winston = require('winston');

// required node.js libraries
var util = require('util');
var request = require('request');
var crypto = require('crypto');

var config;

// constructor
var WinstonAzureLogAnalytics = exports.WinstonAzureLogAnalytics = function WinstonAzureLogAnalyticsInit (options) {

  winston.Transport.call(this, options);
  this.config = options;

}

util.inherits(WinstonAzureLogAnalytics, winston.Transport);
winston.transports.AzureLogAnalytics = WinstonAzureLogAnalytics;

WinstonAzureLogAnalytics.prototype.log = function (level, message, meta, callback) {

  // suppress output in silent mode
  if (this.config.silent) {
    return callback(true);
  }

  var logEntry = {
    "level": level,
    "message": message,
    "meta": meta
  };

  var processingDate = new Date().toUTCString();

  var body = JSON.stringify(logEntry);
  var contentLength = Buffer.byteLength(body, 'utf8');

  var stringToSign = 'POST\n' + contentLength + '\napplication/json\nx-ms-date:' + processingDate + '\n/api/logs';
  var signature = crypto.createHmac('sha256', new Buffer(this.config.credentials.sharedKey, 'base64')).update(stringToSign, 'utf-8').digest('base64');
  var authorization = 'SharedKey ' + this.config.credentials.workspaceId + ':' + signature;

  var headers = {
      "content-type": "application/json", 
      "Authorization": authorization,
      "Log-Type": this.config.logType,
      "x-ms-date": processingDate
  };

  var url = 'https://' + this.config.credentials.workspaceId + '.ods.opinsights.azure.com/api/logs?api-version=' + this.config.apiVersion;

  request.post({url: url, headers: headers, body: body}, function (error, response, body) {

      if(response.statusCode === 200) {
        callback(null, true);
      } else {
        var error = 'Error sending log entry to Azure Log Analytics: ' + response.statusCode;
        console.log(error);
        callback(error);
      }

  });

}
