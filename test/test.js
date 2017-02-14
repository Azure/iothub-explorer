// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var uuid = require('uuid');
var fork = require('child_process').fork;

var iothubConnectionString = process.env.IOTHUB_CONNECTION_STRING;

describe('iothub-explorer', function() {
  this.timeout(10000);

  describe('create -> get -> delete', function() {
    var testDeviceId = 'ihtests-' + uuid.v4();

    it('creates a device with id: ' + testDeviceId, function(testCallback) {
      var createProc = fork('./iothub-explorer-create.js', ['--login', iothubConnectionString, testDeviceId], { silent: true });
      createProc.on('exit', function(code) {
        if(code !== 0) {
          testCallback(new Error('failed to create the device'));
        } else {
          testCallback();
        }
      });
    });

    it('gets the device with id: ' + testDeviceId, function(testCallback) {
      var getProc = fork('./iothub-explorer-get.js', ['--login', iothubConnectionString, testDeviceId], { silent: true });
      getProc.on('exit', function(code) {
        if(code !== 0) {
          testCallback(new Error('failed to create the device'));
        } else {
          testCallback();
        }
      });
    });

    it('deletes the device with id: ' + testDeviceId, function(testCallback) {
      var deleteProc = fork('./iothub-explorer-delete.js', ['--login', iothubConnectionString, testDeviceId], { silent: true });
      deleteProc.on('exit', function(code) {
        if(code !== 0) {
          testCallback(new Error('failed to delete the device'));
        } else {
          testCallback();
        }
      });
    });
  });

  describe('send/receive messages', function() {
    var testDeviceId = 'ihtests-' + uuid.v4();
    var testMessageBody = JSON.stringify({ key: "value" });

    before(function(beforeCallback) {
      var createProc = fork('./iothub-explorer-create.js', ['--login', iothubConnectionString, testDeviceId], { silent: true });
      createProc.on('exit', function(code) {
        if(code !== 0) {
          beforeCallback(new Error('failed to create the device'));
        } else {
          beforeCallback();
        }
      });
    });

    after(function(afterCallback) {
      var deleteProc = fork('./iothub-explorer-delete.js', ['--login', iothubConnectionString, testDeviceId], { silent: true });
      deleteProc.on('exit', function(code) {
        if(code !== 0) {
          afterCallback(new Error('failed to delete the device'));
        } else {
          afterCallback();
        }
      });
    });

    it('sends a telemetry message over AMQP and it is received by the service', function(testCallback) {
      var monitorProc = fork('./iothub-explorer-monitor-events.js', ['--login', iothubConnectionString, testDeviceId, '--raw'], { silent: true });
      var receivedData = '';
      var gotTheMessage = false;
      monitorProc.stdout.on('data', function(chunk) {
        receivedData += chunk;
        if (receivedData.indexOf(testMessageBody) >= 0 && !gotTheMessage) {
          gotTheMessage = true;
          monitorProc.kill();
          testCallback();
        }
      });

      var deviceSimProc = fork('./iothub-explorer-simulate-device.js', ['--login', iothubConnectionString, testDeviceId, '--send', testMessageBody, '--send-count', '1'], { silent: true });
      deviceSimProc.on('exit', function(code) {
        if (code !== 0) {
          monitorProc.kill();
          testCallback(new Error('Could not send the message as ' + testDeviceId));
        }
      });
    });

    it('sends a command and it is received over AMQP by the device', function(testCallback) {
      var deviceSimProc = fork('./iothub-explorer-simulate-device.js', ['--login', iothubConnectionString, testDeviceId, '--receive', '--settle', 'complete'], { silent: true });
      var receivedData = '';
      var gotTheMessage = false;
      deviceSimProc.stdout.on('data', function(chunk) {
        receivedData += chunk;
        if (receivedData.indexOf(testMessageBody) >= 0 && !gotTheMessage) {
          gotTheMessage = true;
          deviceSimProc.kill();
          testCallback();
        }
      });

      var sendProc = fork('./iothub-explorer-send.js', ['--login', iothubConnectionString, testDeviceId, testMessageBody], { silent: true });
      sendProc.on('exit', function(code) {
        if (code !== 0) {
          console.log('Could not send the command');
          deviceSimProc.kill();
          testCallback(new Error('Could not send the command'));
        }
      });
    });
  });
});