// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

module.exports = {
  command: 'monitor <command>',
  describe: 'Commands for monitoring various types of IoT Hub events',
  builder: function (yargs) {
    return yargs.commandDir('monitor_commands');
  },
  handler: function () {}
};
