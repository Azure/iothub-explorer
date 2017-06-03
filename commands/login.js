// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

// Native node modules
var fs = require('fs');
var path = require('path');

// Local dependencies
var inputError = require('../common.js').inputError;
var printSuccess = require('../common.js').printSuccess;
var configLoc = require('../common.js').configLoc;

// Azure IoT SDK dependencies
var ConnectionString = require('azure-iothub').ConnectionString;
var SharedAccessSignature = require('azure-iothub').SharedAccessSignature;

module.exports = {
  command: 'login <connection-string>',
  describe: 'Create a temporary session on your IoT hub',
  builder: {
    duration: {
      default: 3600,
      alias: 'd'
    }
  },
  handler: function(argv) {
    var connString = argv.connectionString;
    var nowInSeconds = Math.floor(Date.now() / 1000);
    var expiry = nowInSeconds + argv.duration;
    var cn = ConnectionString.parse(connString);
    var sas = SharedAccessSignature.create(cn.HostName, cn.SharedAccessKeyName, cn.SharedAccessKey, expiry);
    var loc = configLoc();

    if (isNaN(new Date(expiry * 1000))) {
      inputError('Invalid duration.');
    }

    fs.mkdir(loc.dir, function () {
      var sessionFilePath = path.join(loc.dir, loc.file);
      fs.writeFile(sessionFilePath, sas.toString(), function (err) {
        if (err) inputError(err.toString());
        else {
          printSuccess('Session started, expires on ' + new Date(expiry * 1000).toString());
          printSuccess('Session file: ' + sessionFilePath);
        }
      });
    });
  }
};