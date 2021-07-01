#!/bin/bash
#set -x
source ./version.sh
:<<!
    "start": "cp src/decoder/missile* ./dist/ && cp src/demuxer/missile* ./dist/ && cp -r src/assets dist && browserify src/h265webjs.js -o ./dist/h265webjs_tmp.js && terser ./dist/h265webjs_tmp.js -c pure_funcs=[],toplevel=true -m -o ./dist/h265webjs.js && rm ./dist/h265webjs_tmp.js && cp -r ./dist/* ./demo/dist/ && browserify play.js -o ./dist/play.js && node server.js",
!

REMOVE_FUNCS='"console.log","console.warn"'
# REMOVE_FUNCS=''

rm ./dist/*.js
rm ./dist/*.wasm

cmd[0]="cp src/decoder/missile* ./dist/"
# cmd[1]="cp src/demuxer/missile* ./dist/"
cmd[1]="cp -r src/assets dist"
cmd[2]="browserify src/h265webjs.js -o ./dist/h265webjs_tmp.js"
cmd[3]="terser ./dist/h265webjs_tmp.js -c pure_funcs=[${REMOVE_FUNCS}],toplevel=true -m -o ./dist/h265webjs-${VERSION}.js"
cmd[4]="cp -r src/index.js dist/"
cmd[5]="rm ./dist/h265webjs_tmp.js"
cmd[6]="cp -r ./dist/* ./demo/dist/"
cmd[7]="cp ./src/decoder/raw-parser.js ./dist/" # extension module
cmd[8]="browserify play.js -o ./dist/dist-play-${VERSION}.js"
# cmd[9]="node server.js"

cmdLen=${#cmd[@]}

for ((i=0; i<$cmdLen; i++)); do
	echo ${cmd[$i]}
	${cmd[$i]}
done








