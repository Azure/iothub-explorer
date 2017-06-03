// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

// external dependencies
var colorsTmpl = require('colors-tmpl');

// local dependencies
var inputError = require('../../common.js').inputError;
var serviceError = require('../../common.js').serviceError;

// Azure Event Hubs dependencies
var EventHubsClient = require('azure-event-hubs').Client;

module.exports = {
  command: 'events <device-id>',
  describe: 'Monitor messages sent by devices to the IoT hub',
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
    "consumer-group": {
      "name": "consumer-group",
      "alias": [
        "c"
      ],
      "describe": "Specify the consumer group to use when connecting to Event Hubs partitions",
      "boolean": false
    },
    "start-time": {
      "name": "start-time",
      "alias": [
        "s"
      ],
      "describe": "Specify the time that should be used as a starting point to read messages in the partitions (number of milliseconds since epoch or ISO-8601 string)",
      "boolean": false
    }
  },
  handler: function (argv) {
    if (!argv.login) inputError('You must provide a connection string using the --login argument.');

    var deviceId = argv.deviceId;
    var connectionString = argv.login;

    if (!argv.raw) {
      if (deviceId) {
        console.log(colorsTmpl('\n{grey}Monitoring events from device {green}' + deviceId + '{/green}...{/grey}'));
      } else {
        console.log(colorsTmpl('\n{grey}Monitoring events from all devices...{/grey}'));
      }
    }

    var consumerGroup = argv.consumerGroup || '$Default';
    var startTime = argv.startTime ? new Date(argv.startTime) : Date.now();

    var ehClient = EventHubsClient.fromConnectionString(connectionString);
    ehClient.open()
      .then(ehClient.getPartitionIds.bind(ehClient))
      .then(function (partitionIds) {
        return partitionIds.map(function (partitionId) {
          return ehClient.createReceiver(consumerGroup, partitionId, { 'startAfterTime': startTime }).then(function (receiver) {
            receiver.on('errorReceived', function (error) {
              serviceError(error.message);
            });
            receiver.on('message', function (eventData) {
              var from = eventData.annotations['iothub-connection-device-id'];
              var raw = argv.raw;
              if (!deviceId || (deviceId && from === deviceId)) {
                if (!raw) console.log('==== From: ' + from + ' ====');
                if (eventData.body instanceof Buffer) {
                  console.log(eventData.body.toString());
                } else if (typeof eventData.body === 'string') {
                  console.log(eventData instanceof Buffer ? eventData.body.toString() : JSON);
                } else {
                  if (!raw) {
                    console.log(JSON.stringify(eventData.body, null, 2));
                  } else {
                    console.log(JSON.stringify(eventData.body));
                  }
                }

                if (eventData.applicationProperties) {
                  if (!raw) {
                    console.log('---- properties ----');
                    console.log(JSON.stringify(eventData.applicationProperties, null, 2));
                  } else {
                    console.log(JSON.stringify(eventData.applicationProperties));
                  }
                }

                if (!raw) console.log('====================');
              }
            });
          });
        });
      })
      .catch(function (error) {
        serviceError(error.message);
      });
  }
};