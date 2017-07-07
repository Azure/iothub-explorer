// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

// Native packages
var fs = require('fs');
var path = require('path');

// External dependencies
var prettyjson = require('prettyjson');

// Azure IoT SDK dependencies
var DeviceClient = require('azure-iot-device').Client;
var DeviceConnectionString = require('azure-iot-device').ConnectionString;
var Registry = require('azure-iothub').Registry;

// Local dependencies
var inputError = require('../../common.js').inputError;
var printSuccess = require('../../common.js').printSuccess;
var serviceError = require('../../common.js').serviceError;
var printErrorAndExit = require('../../common.js').printErrorAndExit;
var getSas = require('../../common.js').getSas;
var getHostFromSas = require('../../common.js').getHostFromSas;
var createDeviceConnectionString = require('../../common.js').createDeviceConnectionString;
var createMessageFromArgument = require('../../common.js').createMessageFromArgument;

module.exports = {
  command: 'simulate [device-id]',
  "describe": "Simulate a device.",
  "builder": {
    "device-connection-string": {
      "name": "device-connection-string",
      "describe": "connection string to use for the device",
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
    "protocol": {
      "name": "protocol",
      "describe": "protocol used to send and receive messages (defaults to amqp)",
      "choices": ['amqp', 'amqp-ws', 'http', 'mqtt'],
      "boolean": false
    },
    "send": {
      "name": "send",
      "describe": "send a test message as a device. If the message is not specified, a default message will be used",
      "boolean": false
    },
    "send-interval": {
      "name": "send-interval",
      "alias": [],
      "describe": "interval to use between each message being sent (defaults to 1000ms)",
      "boolean": false,
      "type": "number"
    },
    "send-count": {
      "name": "send-count",
      "describe": "number of messages to send",
      "boolean": false,
      "type": "number"
    },
    "receive": {
      "name": "receive",
      "describe": "Receive cloud-to-device (C2D) messages as a device",
      "boolean": true
    },
    "receive-count": {
      "name": "receive-count",
      "describe": "number of C2D messages to receive",
      "boolean": false,
      "type": "number"
    },
    "settle": {
      "name": "settle",
      "describe": "indicate how the received C2D messages should be settled (defaults to 'complete')",
      "choices": ['complete', 'abandon', 'reject'],
      "boolean": false
    },
    "upload-file": {
      "name": "upload-file",
      "alias": [],
      "describe": "upload a file from the simulated device",
      "boolean": false
    }
  },
  handler: function (argv) {
    var sas = getSas(argv.login);

    if (!argv.deviceConnectionString && !sas) {
      inputError('You must specify the device connection string (--device-connection-string) or the IoT Hub connection string (--login), or use the \'login\' command first.');
    }

    if (!argv.deviceConnectionString && !argv.deviceId) {
      inputError('You must specify either a device connection string (--device-connection-string) or the IoT Hub connection string and a device id as first argument');
    }

    if (!argv.send && !argv.receive && !argv.uploadFile) {
      inputError('Nothing to do: please use --send, --receive or --uploadFile');
    }

    var settleMethod = argv.settle || 'complete';

    var protocolArg = argv.protocol || 'amqp';
    var Protocol;
    switch (protocolArg) {
      case 'amqp-ws':
        Protocol = require('azure-iot-device-amqp').AmqpWs;
        break;
      case 'http':
        Protocol = require('azure-iot-device-http').Http;
        break;
      case 'mqtt':
        Protocol = require('azure-iot-device-mqtt').Mqtt;
        if (settleMethod !== 'complete') {
          inputError('Cannot ' + settleMethod + ' messages with MQTT: messages are automatically completed.');
        }
        break;
      case 'mqtt-ws':
        Protocol = require('azure-iot-device-mqtt').MqttWs;
        if (settleMethod !== 'complete') {
          inputError('Cannot ' + settleMethod + ' messages with MQTT: messages are automatically completed.');
        }
        break;
      default:
        Protocol = require('azure-iot-device-amqp').Amqp;
        break;
    }

    var sendInterval = argv.sendInterval || 1000;
    var sendCount = argv.sendCount || Number.MAX_SAFE_INTEGER;
    var receiveCount = argv.receiveCount || Number.MAX_SAFE_INTEGER;
    var uploadFilePath = argv.uploadFile;

    var deviceConnectionString;
    var deviceId = argv.deviceId;
    if (!deviceId) {
      deviceConnectionString = argv.deviceConnectionString;
      if (!deviceConnectionString) {
        inputError('You must specify either a device connection string (--device-connection-string) or the IoT Hub connection string and a device id as first argument');
      } else {
        deviceId = DeviceConnectionString.parse(deviceConnectionString).DeviceId;
        simulateDevice();
      }
    } else {
      var registry = Registry.fromSharedAccessSignature(sas.toString());
      registry.get(deviceId, function (err, deviceInfo) {
        if (err) serviceError(err);
        else {
          var host = getHostFromSas(sas.toString());
          deviceConnectionString = createDeviceConnectionString(deviceInfo, host);
        }

        simulateDevice();
      });
    }

    function simulateDevice() {
      if (!deviceConnectionString) throw new Error('Couldn\'t figure out device connection string');
      if (!Protocol) throw new Error('Couldn\'t figure out protocol to connect to IoT Hub');

      var sendRunning = !!argv.send;
      var receiveRunning = !!argv.receive;
      var uploadRunning = !!argv.uploadFile;

      var client = DeviceClient.fromConnectionString(deviceConnectionString, Protocol);
      client.open(function (err) {
        if (err) serviceError('Could not connect as device: ' + err.message);
        if (argv.send) {
          var sendCounter = 0;

          var sendItv = setInterval(function () {
            var message = argv.send === true ? createMessageFromArgument('Simulated message: #' + sendCounter) : createMessageFromArgument(argv.send);
            client.sendEvent(message, function (err) {
              if (err) serviceError(err);
              else {
                printSuccess('Message #' + sendCounter + ' sent successfully');
                sendCounter++;
                if (sendCounter === sendCount) {
                  sendRunning = false;
                  clearInterval(sendItv);
                }
              }
            });
          }, sendInterval);
        }

        if (argv.receive) {
          var receiveCounter = 0;
          var onMessage = function (msg) {
            printSuccess('==================');
            printSuccess('Message received:');
            console.log(prettyjson.render(msg.data.toString()));
            if (msg.properties.count() > 0) {
              printSuccess('--- properties ---');
              msg.properties.propertyList.forEach(function (prop) {
                console.log(prop.key + ': ' + prop.value);
              });
            }
            printSuccess('==================');
            receiveCounter++;
            if (receiveCounter === receiveCount) {
              receiveRunning = false;
              client.removeListener('message', onMessage);
            }
            client[settleMethod](msg, function (err) {
              if (err) serviceError('Could not ' + settleMethod + ' message: ' + err.message);
              else {
                printSuccess(settleMethod + ' message: Success');
              }
            });
          };

          client.on('message', onMessage);
        }

        if (uploadFilePath) {
          fs.stat(uploadFilePath, function (err, fileStats) {
            if (err) inputError('Cannot find: ' + argv.uploadFile);
            var fileStream = fs.createReadStream(uploadFilePath);

            client.uploadToBlob(path.basename(uploadFilePath), fileStream, fileStats.size, function (err) {
              if (err) {
                printErrorAndExit('Cannot upload file: ' + err.constructor.name + ': ' + err.message);
              } else {
                printSuccess('Upload successful');
              }
              fileStream.destroy();
              uploadRunning = false;
            });
          });
        }

        var taskInterval = setInterval(function () {
          if (!sendRunning && !receiveRunning && !uploadRunning) {
            printSuccess('Device simulation finished.');
            client.close(function (err) {
              if (err) serviceError(err);
              else {
                clearInterval(taskInterval);
                process.exit(0);
              }
            });
          }
        }, 200);
      });
    }
  }
};