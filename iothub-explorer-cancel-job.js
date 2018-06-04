#!/usr/bin/env node
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var program = require('commander');
var serviceError = require('./common.js').serviceError;
var getSas = require('./common.js').getSas;
var JobClient = require('azure-iothub').JobClient;
var showDeprecationText = require('./common.js').showDeprecationText;

showDeprecationText('az iot hub job cancel');

program
  .description('Cancel existing job')
  .usage('[options] <job-id>')
  .option('-l, --login <connection-string>', 'use the connection string provided as argument to use to authenticate with your IoT Hub instance')
  .parse(process.argv);

var jobId = program.args[0];
var sas = getSas(program.login);

var jobClient =  JobClient.fromSharedAccessSignature(sas);
jobClient.cancelJob(jobId, function (err) {
  if (err) {
    serviceError(err);
  } else {
    console.log('Job ' + jobId + ' cancelled');
  }
});