// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var prettyjson = require('prettyjson');
var serviceError = require('../../common.js').serviceError;
var getSas = require('../../common.js').getSas;
var JobClient = require('azure-iothub').JobClient;

module.exports = {
  command: 'query [job-type] [job-status]',
  "describe": "Query existing jobs",
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
    var jobType = argv.jobType;
    var jobStatus = argv.jobStatus;
    var sas = getSas(argv.login);

    var jobClient = JobClient.fromSharedAccessSignature(sas);
    var query = jobClient.createQuery(jobType, jobStatus);
    var onNewResults = function (err, results) {
      if (err) {
        serviceError(err);
      } else {
        results.forEach(function (job) {
          var output = argv.raw ? JSON.stringify(job) : prettyjson.render(job);
          console.log(output);
        });

        if (query.hasMoreResults) {
          query.next(onNewResults);
        }
      }
    };
    query.next(onNewResults);
  }
};