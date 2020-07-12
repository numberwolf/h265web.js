#!/bin/bash
set -x
BASHPATH=`pwd`
COREPATH="${BASHPATH}/src/core"
OUTPATH="${BASHPATH}/dist"
rm $OUTPATH/*.js
cp "${COREPATH}/missile.wasm" $OUTPATH

ls -l dist
gulp init


