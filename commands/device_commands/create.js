// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var uuid = require('uuid');
var inputError = require('../../common.js').inputError;
var serviceError = require('../../common.js').serviceError;
var printSuccess = require('../../common.js').printSuccess;
var printDevice = require('../../common.js').printDevice;
var getHostFromSas = require('../../common.js').getHostFromSas;
var getSas = require('../../common.js').getSas;
var Registry = require('azure-iothub').Registry;

var info;

module.exports = {
  command: 'create <device-id|device-json>',
  describe: 'Create a device identity in your IoT Hub device registry, either using the specified device id or JSON description.',
  "builder": {
    "auto": {
      "name": "auto",
      "alias": [
        "a"
      ],
      "describe": "create a device with an auto-generated device id",
      "boolean": true
    },
    "connection-string": {
      "name": "connection-string",
      "alias": [
        "c"
      ],
      "describe": "[deprecated] The connection string is now displayed by default",
      "boolean": true
    },
    "display": {
      "name": "display",
      "alias": [
        "d"
      ],
      "describe": "comma-separated list of device properties that should be displayed",
      "boolean": false
    },
    "login": {
      "name": "login",
      "alias": [
        "l"
      ],
      "describe": "connection string to use to authenticate with your IoT Hub instance",
      "boolean": false
    },
    "key1": {
      "name": "key1",
      "alias": [
        "k1"
      ],
      "describe": "specify the primary key for newly created device",
      "boolean": false
    },
    "key2": {
      "name": "key2",
      "alias": [
        "k2"
      ],
      "describe": "specify the secondary key for newly created device",
      "boolean": false
    },
    "raw": {
      "name": "raw",
      "alias": [
        "r"
      ],
      "describe": "use this flag to return raw JSON instead of pretty-printed output",
      "boolean": true
    },
    "x509": {
      "name": "x509",
      "alias": [
        "x"
      ],
      "describe": "generate an x509 certificate to authenticate the device",
      "boolean": true
    },
    "daysValid": {
      "name": "daysValid",
      "alias": [
        "d"
      ],
      "describe": "number of days the x509 certificate should be valid for",
      "boolean": true
    },
    "thumbprint1": {
      "name": "thumbprint1",
      "alias": [
        "t1"
      ],
      "describe": "specify the primary thumbprint of the x509 certificate",
      "boolean": false
    },
    "thumbprint2": {
      "name": "thumbprint2",
      "alias": [
        "t2"
      ],
      "describe": "specify the secondary thumbprint of the x509 certificate",
      "boolean": false
    }
  },
  handler: function(argv) {
    if ((argv.key1 || argv.key2) && (argv.x509 || argv.thumbprint1 || argv.thumbprint2)) {
      inputError('A device can use either x509 certificates or symmetric keys to authenticate but not both.');
    }

    if (argv.daysValid && !argv.x509) {
      inputError('The --daysValid option applies only with x509 certificates');
    }

    if (argv.auto && argv.deviceId) {
      inputError('You cannot use the \'--auto\' option if you specify the device id or description');
    } else if (!argv.auto && !argv.deviceId) {
      inputError('You must either use the \'--auto\' option or specify a device id or description');
    } else if (argv.auto) {
      info = {
        deviceId: uuid.v4(),
        status: 'enabled'
      };
    } else {
      try {
        // 'create' command expects either deviceId or JSON device description
        info = (argv.deviceId.charAt(0) !== '{') ? { deviceId: argv.deviceId, status: 'enabled' } : JSON.parse(argv.deviceId);
      }
      catch (e) {
        if (e instanceof SyntaxError) inputError('Device information isn\'t valid JSON');
        else throw e;
      }
    }

    if (argv.x509) {
      if (argv.thumbprint1 || argv.thumbprint2) {
        info.authentication = {
          x509Thumbprint: {
            primaryThumbprint: argv.thumbprint1,
            secondaryThumbprint: argv.thumbprint2,
          }
        };
        console.log(JSON.stringify(info, null, 2));
        createDevice(argv, info);
      } else {
        generateCertAndCreateDevice(argv, info);
      }
    } else if (argv.key1 || argv.key2) {
      info.authentication = {
        symmetricKey: {
          primaryKey: argv.key1,
          secondaryKey: argv.key2,
        }
      };
      createDevice(argv, info);
    } else if (isMissingAuth(info)) {
      console.log('No authentication method given. Device will be created with auto-generated symmetric keys.');
      createDevice(argv, info);
    } else {
      // Auth info provided as part of the JSON parameter
      createDevice(argv, info);
    }
  }
};

function createDevice(argv, deviceInfo) {
  var sas = getSas(argv.login);

  var registry = Registry.fromSharedAccessSignature(sas);
  registry.create(deviceInfo, function (err, createdDeviceInfo) {
    if (err) serviceError(err);
    else {
      printSuccess('Created device ' + deviceInfo.deviceId);
      var host = getHostFromSas(sas);
      printDevice(createdDeviceInfo, host, argv.display, argv.raw);
    }
  });
}

function generateCertAndCreateDevice(argv, deviceInfo) {
  var pem = require('pem');
  var fs = require('fs');

  var certFile = deviceInfo.deviceId + '-cert.pem';
  var keyFile = deviceInfo.deviceId + '-key.pem';
  var thumbprint = null;

  var certOptions = {
    selfSigned: true,
    days: argv.daysValid || 365
  };

  pem.createCertificate(certOptions, function (err, result) {
    if (err) {
      inputError('You must have OpenSSL installed in your path for iothub-explorer to be able to generate x509 certificates');
    } else {
      fs.writeFileSync(certFile, result.certificate);
      fs.writeFileSync(keyFile, result.clientKey);
      printSuccess('Certificate File: ' + certFile);
      printSuccess('Key File: ' + keyFile);
      pem.getFingerprint(result.certificate, function (err, result) {
        thumbprint = result.fingerprint.replace(/:/g, '');
        deviceInfo.authentication = {
          x509Thumbprint: {
            primaryThumbprint: thumbprint
          }
        };
        createDevice(argv, deviceInfo);
      });
    }
  });
}

function isMissingAuth(deviceInfo) {
  return deviceInfo.authentication ?
    deviceInfo.authentication.symmetricKeys ?
      deviceInfo.authentication.symmetricKeys.primaryKey || deviceInfo.authentication.symmetricKeys.secondaryKey
      : deviceInfo.authentication.x509Thumbprints ?
        deviceInfo.authentication.x509Thumbprints.primaryThumbprint || deviceInfo.authentication.x509Thumbprints.secondaryThumbprint
        : false
    : false;
}
