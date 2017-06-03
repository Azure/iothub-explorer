// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var inputError = require('../../common.js').inputError;
var serviceError = require('../../common.js').serviceError;
var printSuccess = require('../../common.js').printSuccess;
var getSas = require('../../common.js').getSas;
var Registry = require('azure-iothub').Registry;

module.exports = {
  command: 'delete <device-id>',
  describe: 'Delete a device identity from your IoT hub device registry',
  builder: {
    login: {
      alias: 'l',
      describe: 'connection string to use to authenticate with your IoT hub',
      boolean: false
    }
  },
  handler: function(argv) {
    if (!argv.deviceId) {
      inputError('You must specify a deviceId');
    }

    var deviceId = argv.deviceId;
    var sas = getSas(argv.login);

    var registry = Registry.fromSharedAccessSignature(sas);
    registry.delete(deviceId, function (err) {
      if (err) serviceError(err);
      else printSuccess('Deleted device ' + deviceId);
    });
  }
};