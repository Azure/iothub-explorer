// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

// external dependencies
var prettyjson = require('prettyjson');

// local dependencies
var inputError = require('../../common.js').inputError;
var serviceError = require('../../common.js').serviceError;

// Azure Event Hubs dependencies
var EventHubsClient = require('azure-event-hubs').Client;

module.exports = {
  command: 'ops',
  "describe": "Listen to the operations monitoring endpoint of your IoT Hub instance (must be enabled in the portal)",
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
    if (!argv.login) inputError('You must provide a connection string using the --login argument.');

    var connectionString = argv.login;

    var ehClient = EventHubsClient.fromConnectionString(connectionString, '/messages/operationsMonitoringEvents/*');
    var startTime = Date.now();
    ehClient.open()
      .then(ehClient.getPartitionIds.bind(ehClient))
      .then(function (partitionIds) {
        return partitionIds.map(function (partitionId) {
          return ehClient.createReceiver('$Default', partitionId, { 'startAfterTime': startTime }).then(function (receiver) {
            receiver.on('errorReceived', function (error) {
              serviceError(error.message);
            });
            receiver.on('message', function (eventData) {
              var rendered = argv.raw ? JSON.stringify(eventData) : prettyjson.render(eventData);
              console.log(rendered);
            });
          });
        });
      })
      .catch(function (error) {
        serviceError(error.message);
      });
  }
};