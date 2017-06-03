// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

module.exports = {
  command: 'device <command>',
  describe: 'Manage IoT Hub devices',
  builder: function(yargs) {
    return yargs.commandDir('device_commands');
  },
  handler: function(){}
};
