#!/bin/sh

buildroot=$(cd "$(dirname "$0")/.." && pwd)

cd $buildroot

npm install
[ $? -eq 0 ] || exit $?

npm run ci
[ $? -eq 0 ] || exit $?