#!/usr/bin/env node
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var program = require('commander');
var packageJson = require('./package.json');
var chalk = require('chalk');

console.log('--------');
console.log(chalk.red(chalk.bold("DEPRECATION NOTICE: iothub-explorer will be retired on November 31st, 2018")));
console.log(chalk.bold("It has been replaced by the Azure CLI IoT Extension (https://aka.ms/iotcli)."));
console.log('--------');

program
  .version(packageJson.version)
  .usage('[options] <command> [command-options] [command-args]')
  .command('login', 'start a session on your IoT hub')
  .command('logout', 'terminate the current session on your IoT hub')
  .command('list', 'list the device identities currently in your IoT hub device registry')
  .command('create <device-id|device-json>', 'create a device identity in your IoT hub device registry')
  .command('delete <device-id>', 'delete a device identity from your IoT hub device registry')
  .command('get <device-id>', 'get a device identity from your IoT hub device registry')
  .command('import-devices', 'import device identities in bulk: local file -> Azure blob storage -> IoT hub')
  .command('export-devices', 'export device identities in bulk: IoT hub -> Azure blob storage -> local file')
  .command('send <device-id> <message>', 'send a message to the device (cloud-to-device/C2D)')
  .command('monitor-feedback', 'monitor feedback sent by devices to acknowledge cloud-to-device (C2D) messages')
  .command('monitor-events [device-id]', 'listen to events coming from devices (or one in particular)')
  .command('monitor-uploads', 'monitor the file upload notifications endpoint')
  .command('monitor-ops', 'listen to the operations monitoring endpoint of your IoT hub instance')
  .command('sas-token <device-id>', 'generate a SAS Token for the given device')
  .command('simulate-device <device-id>', 'simulate a device with the specified id')
  .command('get-twin <device-id>', 'get the twin of a device')
  .command('update-twin <device-id> <twin-json>', 'update the twin of a device and return it.')
  .command('query-twin <sql-query>', 'get twin data matching the sql-query argument')
  .command('query-job [job-type] [job-status]', 'get scheduled job data matching the sql-query argument')
  .command('device-method <device-id> <method-name> [method-payload] [timeout-in-seconds]', 'executes a device method on the specified device')
  .command('cancel-job <job-id>', 'cancels the job with the specified jobId')
  .parse(process.argv);