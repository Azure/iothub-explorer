// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

// Native node modules
var fs = require('fs');
var path = require('path');

// Local dependencies
var printErrorAndExit = require('../common.js').printErrorAndExit;
var printSuccess = require('../common.js').printSuccess;
var configLoc = require('../common.js').configLoc;

module.exports = {
  command: 'logout',
  describe: 'Terminate a temporary session on your IoT hub',
  handler: function() {
    var loc = configLoc();
    var sessionFilePath = path.join(loc.dir, loc.file);

    try {
      fs.unlinkSync(sessionFilePath);
      printSuccess('Session successfully terminated.');
      printSuccess('Removed session file: ' + sessionFilePath);
    }
    catch (err) {
      if (err.code === 'ENOENT') {
        printErrorAndExit('No session information found.');
      } else {
        throw err;
      }
    }
  }
};
