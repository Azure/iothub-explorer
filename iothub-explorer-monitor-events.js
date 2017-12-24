#!/usr/bin/env node
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var Registry = require('azure-iothub').Registry;

// external dependencies
var program = require('commander');
var colorsTmpl = require('colors-tmpl');
var Promise = require('bluebird');

// local dependencies
var inputError = require('./common.js').inputError;
var serviceError = require('./common.js').serviceError;

// Azure Event Hubs dependencies
var EventHubsClient = require('azure-event-hubs').Client;

function coerceAndValidateDuration(value) {
  var d = parseInt(value);
  if (isNaN(d)) {
    inputError('The value specified for --duration must be a number.');
  }
  else if (d < 0) {
    inputError('The value specified for --duration must be a positive number.');
  }
  else if (d * 1000 > Number.MAX_SAFE_INTEGER) {
    inputError('The value specified for --duration is too big. It must be no greater than Number.MAX_SAFE_INT / 1000.');
  }

  return d * 1000;
}

program
  .description('Monitor messages sent by devices to the IoT hub')
  .option('-l, --login <connectionString>', 'Use the provided connection string to authenticate with IoT Hub')
  .option('-r, --raw', 'Return raw output instead of pretty-printed output (useful for automation)')
  .option('-v, --verbose', 'Show more information from the received event, including annotations and properties')
  .option('-c, --consumer-group <consumer-group>', 'Use the provided consumer group when connecting to Event Hubs')
  .option('-s, --start-time <start-time>', 'Read messages that arrived on or after the given time (milliseconds since epoch or ISO-8601 string)')
  .option('-d, --duration <duration>', 'Exit aften the given number of seconds (runs indefinitely if not specified)', coerceAndValidateDuration)
  .parse(process.argv);

if (!program.login) inputError('You must provide a connection string using the --login argument.');

var deviceId = program.args[0];
var connectionString = program.login;

var monitorEvents = function () {
  if (!program.raw) {
    if (deviceId) {
      console.log(colorsTmpl('\n{grey}Monitoring events from device {green}' + deviceId + '{/green}...{/grey}'));
    } else {
      console.log(colorsTmpl('\n{grey}Monitoring events from all devices...{/grey}'));
    }
  }

  var consumerGroup = program.consumerGroup || '$Default';
  var startTime = program.startTime ?
    isNaN(program.startTime) ? new Date(program.startTime) : new Date(parseInt(program.startTime)) :
    Date.now();

  var ehClient = EventHubsClient.fromConnectionString(connectionString);
  ehClient.open()
    .then(function () {
      return Promise.any([
        program.duration ? Promise.delay(program.duration).then(ehClient.close.bind(ehClient)) : Promise.race([]),
        ehClient.getPartitionIds()
          .then(function (partitionIds) {
            return partitionIds.map(function (partitionId) {
              return ehClient.createReceiver(consumerGroup, partitionId, { 'startAfterTime': startTime })
                .then(function (receiver) {
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
      ])
    })
    .catch(function (error) {
      serviceError(error.message);
    });
};

if (deviceId) {
  var registry = Registry.fromConnectionString(connectionString);
  registry.get(deviceId, function (err) {
    if (err) serviceError(err);
    else {
      monitorEvents();
    }
  });
}
else {
  monitorEvents();
}