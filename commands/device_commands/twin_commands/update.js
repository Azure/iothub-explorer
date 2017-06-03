// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var prettyjson = require('prettyjson');
var inputError = require('../../../common.js').inputError;
var serviceError = require('../../../common.js').serviceError;
var getSas = require('../../../common.js').getSas;
var Registry = require('azure-iothub').Registry;

module.exports = {
  command: 'update <device-id> <device-json>',
  describe: 'Update the twin of a device with the JSON description provided on the command line',
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
    if (!argv.deviceId) inputError('You must specify a deviceId.');
    if (!argv.deviceJson) inputError('You must specify the JSON to update the twin with.');

    var deviceId = argv.deviceId;
    var twinJson = argv.deviceJson;

    var updateInfo;
    try {
      updateInfo = JSON.parse(twinJson);
    }
    catch (e) {
      if (e instanceof SyntaxError) inputError('device-json isn\'t valid JSON');
      else throw e;
    }

    var sas = getSas(argv.login);

    var registry = Registry.fromSharedAccessSignature(sas);
    registry.getTwin(deviceId, function (err, twin) {
      if (err) {
        serviceError(err);
      } else {
        registry.updateTwin(twin.deviceId, updateInfo, twin.etag, function (err, updatedTwin) {
          if (err) {
            serviceError(err);
          } else {
            // The _registry property that shouldn't be printed and make prettyjson crash.
            delete updatedTwin._registry;
            var output = argv.raw ? JSON.stringify(updatedTwin) : prettyjson.render(updatedTwin);
            console.log(output);
          }
        });
      }
    });
  }
};
