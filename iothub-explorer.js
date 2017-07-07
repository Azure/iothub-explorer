#!/usr/bin/env node
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var yargs = require('yargs');

yargs
  .usage('[options] <command> [command-options] [command-args]')
  .version()
  .commandDir('commands')
  .demandCommand()
  .help()
  .argv;
