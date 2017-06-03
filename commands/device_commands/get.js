// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var inputError = require('../../common.js').inputError;
var serviceError = require('../../common.js').serviceError;
var printDevice = require('../../common.js').printDevice;
var getHostFromSas = require('../../common.js').getHostFromSas;
var getSas = require('../../common.js').getSas;
var Registry = require('azure-iothub').Registry;

module.exports = {
  command: 'get <device-id>',
  describe: 'Get a device identity from your IoT hub device registry',
  "builder": {
    "connection-string": {
      "name": "connection-string",
      "alias": [
        "c"
      ],
      "describe": "[deprecated] The connection string is now displayed by default",
      "boolean": true
    },
    "display": {
      "name": "display",
      "alias": [
        "d"
      ],
      "describe": "filter the properties of the device that should be displayed using a comma-separated list of property names",
      "boolean": false
    },
    "login": {
      "name": "login",
      "alias": [
        "l"
      ],
      "describe": "use the connection string provided as argument to use to authenticate with your IoT Hub instance",
      "boolean": false
    },
    "raw": {
      "name": "raw",
      "alias": [
        "r"
      ],
      "describe": "use this flag to return raw output instead of pretty-printed output",
      "boolean": true
    }
  },
  handler: function (argv) {
    if (!argv.deviceId) inputError('You must specify a deviceId.');
    var sas = getSas(argv.login);
    var deviceId = argv.deviceId;

    var registry = Registry.fromSharedAccessSignature(sas);
    registry.get(deviceId, function (err, device) {
      if (err) serviceError(err);
      else {
        var host = getHostFromSas(sas);
        printDevice(device, host, argv.display, argv.raw);
      }
    });
  }
};
