#!/usr/bin/env node
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var program = require('commander');
var serviceError = require('./common.js').serviceError;
var createDeviceJSONObject = require('./common.js').createDeviceJSONObject;
var getHostFromSas = require('./common.js').getHostFromSas;
var getSas = require('./common.js').getSas;
var Registry = require('azure-iothub').Registry;
var prettyjson = require('prettyjson');

program
  .description('List the device identities currently in your IoT hub device registry')
  .option('-l, --login <connection-string>', 'use the connection string provided as argument to use to authenticate with your IoT hub')
  .option('-d, --display <property-filter>', 'filter the properties of the device that should be displayed using a comma-separated list of property names')
  .option('-r, --raw', 'use this flag to return raw output instead of pretty-printed output')
  .option('-c, --connection-string', '[deprecated] The connection string is now displayed by default')
  .parse(process.argv);

var sas = getSas(program.login);

var registry = Registry.fromSharedAccessSignature(sas);
registry.list(function (err, devices) {
  if (err) serviceError(err);
  else {
    var host = getHostFromSas(sas);
    var results = [];

    devices.forEach(function (device) {
      results.push(createDeviceJSONObject(device, host, program.display, program.raw));
    });

    results = program.raw ? JSON.stringify(results) : prettyjson.render(results);
    
    console.log(results);
  }
});