// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

// external dependencies
var colorsTmpl = require('colors-tmpl');
var prettyjson = require('prettyjson');

// local dependencies
var inputError = require('../../common.js').inputError;
var serviceError = require('../../common.js').serviceError;
var getSas = require('../../common.js').getSas;

// Azure Event Hubs dependencies
var ServiceClient = require('azure-iothub').Client;

module.exports = {
  command: 'uploads',
  "describe": "Monitor file upload notifications emitted by devices",
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
    }
  },
  handler: function (argv) {
    var sas = getSas(argv.login);
    var client = ServiceClient.fromSharedAccessSignature(sas.toString());
    client.open(function (err) {
      if (err) {
        inputError('Could not open the connection to the service: ' + err.message);
      } else {
        client.getFileNotificationReceiver(function (err, receiver) {
          if (err) serviceError(err);
          if (!argv.raw) {
            console.log(colorsTmpl('\n{yellow}Waiting for file notifications...{/yellow} (Ctrl-C to quit)'));
          }

          receiver.on('errorReceived', function (err) { serviceError(err); });
          receiver.on('message', function (fileNotification) {
            var notif = JSON.parse(fileNotification.data.toString());
            var rendered = argv.raw ?
              JSON.stringify(notif) :
              prettyjson.render(notif) + '\n----------------------------\n';

            console.log(rendered);
          });
        });
      }
    });
  }
};