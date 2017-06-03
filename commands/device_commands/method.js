// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var prettyjson = require('prettyjson');
var inputError = require('../../common.js').inputError;
var serviceError = require('../../common.js').serviceError;
var getSas = require('../../common.js').getSas;
var Client = require('azure-iothub').Client;

module.exports = {
  command: 'method <device-id> <method-name> [method-payload] [method-timeout]',
  describe: 'Call a device method on a specific device',
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
    if (!argv.methodName) inputError('You must specify the JSON to update the twin with.');

    var deviceId = argv.deviceId;
    var methodName = argv.methodName;
    var methodPayload = argv.methodPayload;
    var methodTimeout = argv.methodTimeout;

    if (!deviceId) inputError('Please provide a valid device id');
    if (!methodName) inputError('Please provide a valid method name');

    var sas = getSas(argv.login);

    var client = Client.fromSharedAccessSignature(sas);

    var actualPayload = methodPayload;

    if (methodPayload) {
      try {
        actualPayload = JSON.parse(methodPayload);
      } catch (err) {
        if (!(err instanceof SyntaxError)) {
          throw err;
        }
      }
    }

    var methodParams = {
      methodName: methodName,
      payload: actualPayload || null,
      timeoutInSeconds: !!methodTimeout ? parseInt(methodTimeout) : null
    };

    client.invokeDeviceMethod(deviceId, methodParams, function (err, methodResult) {
      if (err) {
        serviceError(err);
      } else {
        var output = argv.raw ? JSON.stringify(methodResult) : prettyjson.render(methodResult);
        console.log(output);
      }
    });
  }
};