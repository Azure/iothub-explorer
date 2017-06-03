// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

module.exports = {
  command: 'job <command>',
  describe: 'Manage IoT Hub jobs',
  builder: function (yargs) {
    return yargs.commandDir('job_commands');
  },
  handler: function () { }
};
