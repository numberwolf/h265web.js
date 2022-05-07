#!/bin/bash
# /********************************************************* 
#  * LICENSE: LICENSE-Free_CN.MD
#  * 
#  * Author: Numberwolf - ChangYanlong
#  * QQ: 531365872
#  * QQ Group:925466059
#  * Wechat: numberwolf11
#  * Discord: numberwolf#8694
#  * E-Mail: porschegt23@foxmail.com
#  * Github: https://github.com/numberwolf/h265web.js
#  * 
#  * 作者: 小老虎(Numberwolf)(常炎隆)
#  * QQ: 531365872
#  * QQ群: 531365872
#  * 微信: numberwolf11
#  * Discord: numberwolf#8694
#  * 邮箱: porschegt23@foxmail.com
#  * 博客: https://www.jianshu.com/u/9c09c1e00fd1
#  * Github: https://github.com/numberwolf/h265web.js
#  * 
#  **********************************************************/
#set -x
source ./version.sh
:<<!
    "start": "cp src/decoder/missile* ./dist/ && cp src/demuxer/missile* ./dist/ && cp -r src/assets dist && browserify src/h265webjs.js -o ./dist/h265webjs_tmp.js && terser ./dist/h265webjs_tmp.js -c pure_funcs=[],toplevel=true -m -o ./dist/h265webjs.js && rm ./dist/h265webjs_tmp.js && cp -r ./dist/* ./demo/dist/ && browserify play.js -o ./dist/play.js && node server.js",
!

# # REMOVE_FUNCS='"console.log","console.warn","alert"'
# # REMOVE_FUNCS='"alert"'
# REMOVE_FUNCS='"console.warn","alert"'
# # REMOVE_FUNCS='"console.log","alert"'
# # REMOVE_FUNCS=''

# rm ./dist/*.js
# rm ./dist/*.wasm

# cmd[0]="cp src/decoder/missile* ./dist/"
# # cmd[1]="cp src/demuxer/missile* ./dist/"
# cmd[1]="cp -r src/assets dist"
# cmd[2]="browserify src/h265webjs.js -o ./dist/h265webjs_tmp.js"
# cmd[3]="terser ./dist/h265webjs_tmp.js -c pure_funcs=[${REMOVE_FUNCS}],toplevel=true -m -o ./dist/h265webjs-${VERSION}.js"
# cmd[4]="cp -r src/index.js dist/"
# cmd[5]="rm ./dist/h265webjs_tmp.js"
# cmd[6]="cp -r ./dist/* ./demo/dist/"
# cmd[7]="cp ./src/decoder/raw-parser.js ./dist/" # extension module

# cmd[8]="browserify worker-fetch.js -o ./dist/worker-fetch-dist.js"
# cmd[9]="browserify worker-parse.js -o ./dist/worker-parse-dist.js"

# cmd[10]="cat src/decoder/missile.js src/decoder/dc-worker.js > ./dist/dc-worker-dist.tmp.js"
# cmd[11]="terser ./dist/dc-worker-dist.tmp.js -c pure_funcs=[${REMOVE_FUNCS}],toplevel=true -m -o ./dist/dc-worker-dist.js"

# cmd[12]="browserify play.js -o ./dist/dist-play.js"
# # cmd[9]="cp raw-worker.js ./dist/raw-worker.js"
# # cmd[10]="cp parse-worker.js ./dist/parse-worker.js"


# cmdLen=${#cmd[@]}

# for ((i=0; i<$cmdLen; i++)); do
# 	echo ${cmd[$i]}
# 	${cmd[$i]}
# done

REMOVE_FUNCS='"console.log","console.warn","alert"'
# REMOVE_FUNCS='"alert"'
# REMOVE_FUNCS='"console.warn","alert"'
# REMOVE_FUNCS='"console.log","alert"'
# REMOVE_FUNCS=''

rm ./dist/*.js
rm ./dist/*.wasm

cp src/decoder/missile* ./dist/
# cmd[1]="cp src/demuxer/missile* ./dist/
cp -r src/assets dist
browserify src/h265webjs.js -o ./dist/h265webjs_tmp.js
terser ./dist/h265webjs_tmp.js -c pure_funcs=[${REMOVE_FUNCS}],toplevel=true -m -o ./dist/h265webjs-${VERSION}.js
cp -r src/index.js dist/
rm ./dist/h265webjs_tmp.js
cp -r ./dist/* ./demo/dist/
cp ./src/decoder/raw-parser.js ./dist/ # extension module

browserify worker-fetch.js -o ./dist/worker-fetch-dist.js
browserify worker-parse.js -o ./dist/worker-parse-dist.js

cat src/decoder/missile.js src/decoder/dc-worker.js > ./dist/dc-worker-dist.tmp.js
terser ./dist/dc-worker-dist.tmp.js -c pure_funcs=[${REMOVE_FUNCS}],toplevel=true -m -o ./dist/dc-worker-dist.js

browserify play.js -o ./dist/dist-play.js







