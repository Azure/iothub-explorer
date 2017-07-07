// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var prettyjson = require('prettyjson');
var inputError = require('../../../common.js').inputError;
var serviceError = require('../../../common.js').serviceError;
var getSas = require('../../../common.js').getSas;
var Registry = require('azure-iothub').Registry;

module.exports = {
  command: 'get <device-id>',
  describe: 'Get the twin of the specified device',
  builder: {
    login: {
      alias: 'l',
      describe: 'connection string to use to authenticate with your IoT hub',
      boolean: false
    },
    raw: {
      alias: 'r',
      describe: 'use this flag to return raw output instead of pretty-printed output',
      boolean: true
    }
  },
  handler: function (argv) {
    var deviceId = argv.deviceId;
    if (!deviceId) inputError('You must specify a deviceId.');

    var sas = getSas(argv.login);

    var registry = Registry.fromSharedAccessSignature(sas);
    registry.getTwin(deviceId, function (err, twin) {
      if (err) serviceError(err);
      else {
        // The _registry property that shouldn't be printed and make prettyjson crash.
        delete twin._registry;
        var output = argv.raw ? JSON.stringify(twin) : prettyjson.render(twin);
        console.log(output);
      }
    });
  }
};
