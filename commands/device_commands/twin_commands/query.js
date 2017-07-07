// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var prettyjson = require('prettyjson');
var inputError = require('../../../common.js').inputError;
var serviceError = require('../../../common.js').serviceError;
var getSas = require('../../../common.js').getSas;
var Registry = require('azure-iothub').Registry;

module.exports = {
  command: 'query <device-id>',
  describe: 'Query the registry for twins matching the SQL query passed as argument',
  builder: {
    login: {
      alias: 'l',
      describe: 'connection string to use to authenticate with your IoT hub',
      boolean: false
    },
    raw: {
      alias: 'r',
      describe: 'use this flag to return raw output instead of pretty-printed output',
      boolean: true
    }
  },
  handler: function (argv) {
    if (!argv.deviceId) inputError('You must specify a SQL query.');
    var sqlQuery = argv.deviceId;
    var sas = getSas(argv.login);

    var registry = Registry.fromSharedAccessSignature(sas);
    var query = registry.createQuery(sqlQuery);
    var onNewResults = function (err, results) {
      if (err) {
        serviceError(err);
      } else {
        results.forEach(function (twin) {
          delete twin._registry;
          var output = argv.raw ? JSON.stringify(twin) : prettyjson.render(twin);
          console.log(output);
        });

        if (query.hasMoreResults) {
          query.nextAsTwin(onNewResults);
        }
      }
    };
    query.nextAsTwin(onNewResults);
  }
};
