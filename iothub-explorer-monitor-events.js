#!/usr/bin/env node
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

// external dependencies
var program = require('commander');
var colorsTmpl = require('colors-tmpl');

// local dependencies
var inputError = require('./common.js').inputError;
var serviceError = require('./common.js').serviceError;

// Azure Event Hubs dependencies
var EventHubsClient = require('azure-event-hubs').Client;

program
  .description('Monitor messages sent by devices to the IoT hub')
  .option('-l, --login <connectionString>', 'use the connection string provided as argument to use to authenticate with your IoT hub')
  .option('-r, --raw', 'use this flag to return raw output instead of pretty-printed output')
  .option('-v, --verbose', 'shows all the information contained in the event received, including annotations and properties')
  .option('-cg, --consumer-group <consumer-group>', 'Specify the consumer group to use when connecting to Event Hubs partitions')
  .option('-st, --start-time <start-time>', 'Specify the time that should be used as a starting point to read messages in the partitions (number of milliseconds since epoch or ISO-8601 string)')
  .parse(process.argv);

if(!program.login) inputError('You must provide a connection string using the --login argument.');

var deviceId = program.args[0];
var connectionString = program.login;

if(!program.raw) {
  if (deviceId) {
    console.log(colorsTmpl('\n{grey}Monitoring events from device {green}' + deviceId + '{/green}...{/grey}'));
  } else {
    console.log(colorsTmpl('\n{grey}Monitoring events from all devices...{/grey}'));
  }
}

var consumerGroup = program.consumerGroup || '$Default';
var startTime = program.startTime ? new Date(program.startTime) : Date.now();

var ehClient = EventHubsClient.fromConnectionString(connectionString);
ehClient.open()
        .then(ehClient.getPartitionIds.bind(ehClient))
        .then(function (partitionIds) {
          return partitionIds.map(function (partitionId) {
            return ehClient.createReceiver(consumerGroup, partitionId, { 'startAfterTime' : startTime}).then(function(receiver) {
              receiver.on('errorReceived', function (error) {
                serviceError(error.message);
              });
              receiver.on('message', function (eventData) {
                var from = eventData.annotations['iothub-connection-device-id'];
                var raw = program.raw;
                if (!deviceId || (deviceId && from === deviceId)) {
                  if (!raw) console.log('==== From: ' + from + ' ====');
                  if (eventData.body instanceof Buffer) {
                    console.log(eventData.body.toString());
                  } else if (typeof eventData.body === 'string') {
                    console.log(JSON.stringify(eventData.body));
                  } else {
                    if (!raw) {
                      console.log(JSON.stringify(eventData.body, null, 2));
                    } else {
                      console.log(JSON.stringify(eventData.body));
                    }
                  }

                  if (program.verbose) {
                    if (eventData.annotations) {
                      if (!raw) {
                        console.log('---- annotations ----');
                        console.log(JSON.stringify(eventData.annotations, null, 2));
                      } else {
                        console.log(JSON.stringify(eventData.annotations));
                      }
                    }

                    if (eventData.properties) {
                      if (!raw) {
                        console.log('---- properties ----');
                        console.log(JSON.stringify(eventData.properties, null, 2));
                      } else {
                        console.log(JSON.stringify(eventData.properties));
                      }
                    }
                  }

                  if (eventData.applicationProperties) {
                    if (!raw) {
                      console.log('---- application properties ----');
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
