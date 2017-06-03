// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

// external dependencies
var colorsTmpl = require('colors-tmpl');

// local dependencies
var inputError = require('../../common.js').inputError;
var serviceError = require('../../common.js').serviceError;
var getSas = require('../../common.js').getSas;
var createMessageFromArgument = require('../../common.js').createMessageFromArgument;

// Azure Event Hubs dependencies
var ServiceClient = require('azure-iothub').Client;

module.exports = {
  command: 'send <device-id> <message>',
  "describe": "Send a message to device (cloud-to-device/C2D).",
  "builder": {
    "login": {
      "name": "login",
      "alias": [
        "l"
      ],
      "describe": "use the connection string provided as argument to use to authenticate with your IoT hub",
      "boolean": false
    },
    "raw": {
      "name": "raw",
      "alias": [
        "r"
      ],
      "describe": "use this flag to return raw output instead of pretty-printed output",
      "boolean": true
    },
    "ack": {
      "name": "ack",
      "alias": [
        "a"
      ],
      "describe": "set the type of feedback that you would like to receive: none|positive|negative|full",
      "boolean": false
    }
  },
  handler: function (argv) {
    if (!argv.deviceId) inputError('You need to specify a device id.');
    if (!argv.message) inputError('You need to specify a message.');

    var deviceId = argv.deviceId;
    var messageArg = argv.message;
    var ack = argv.ack;

    var sas = getSas(argv.login);
    var client = ServiceClient.fromSharedAccessSignature(sas.toString());
    client.open(function (err) {
      if (err) {
        inputError('Could not open the connection to the service: ' + err.message);
      } else {
        var message = createMessageFromArgument(messageArg, ack);
        client.send(deviceId, message, function (err) {
          if (err) serviceError(err);
          if (argv.raw) {
            console.log(message.messageId);
          } else {
            var successMessage = '{green}Message sent with id: {/green}' + message.messageId;
            if (argv.ack) successMessage += '. {grey}Acknowledgement requested: ' + argv.ack + '{/grey}';
            console.log(colorsTmpl(successMessage));
          }
          client.close(function (err) {
            if (err) serviceError(err);
          });
        });
      }
    });
  }
};