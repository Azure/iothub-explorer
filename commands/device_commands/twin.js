// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

module.exports = {
  command: 'twin <command>',
  describe: 'Manage IoT Hub device twins',
  builder: function (yargs) {
    return yargs.commandDir('twin_commands');
  },
  handler: function () { }
};
