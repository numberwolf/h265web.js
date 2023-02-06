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

H265WEBJS_COMPILE_MULTI_THREAD_SHAREDBUFFER=0

REMOVE_FUNCS='"console.log","console.warn","alert"'
# REMOVE_FUNCS='"console.log","console.warn"'
# REMOVE_FUNCS='"alert"'
# REMOVE_FUNCS='"console.warn","alert"'
# REMOVE_FUNCS='"console.log","alert"'
# REMOVE_FUNCS=''

function echoLog {
    local log_str=$*
    local color=30 # front 30-39 # color 40-49 , 38 39 except
    local color2=42

    local color_param="${color};${color2};5"
    echo -e -e "\033[${color_param}m${log_str}\033[0m"
}

DIST_PATH='dist'
if [[ $H265WEBJS_COMPILE_MULTI_THREAD_SHAREDBUFFER -eq 0 ]]; then
	DIST_PATH='dist'
else
	DIST_PATH='dist-multi-thread'
fi

if [[ ! -d $DIST_PATH ]]; then
    mkdir -p $DIST_PATH
fi

echo ""
echoLog "==========================================================="
echoLog "==========================================================="
echoLog "========    Step.1 START EXECUTE COMPILE =================="
echoLog "==========================================================="
echoLog "==========================================================="
rm ./$DIST_PATH/*.js
rm ./$DIST_PATH/*.wasm

# cp src/decoder/missile* $DIST_PATH/
# terser src/decoder/missile.js -c pure_funcs=[${REMOVE_FUNCS}],toplevel=true -m -o ./dist/missile.js
# cmd[1]="cp src/demuxer/missile* ./dist/
cp -r src/assets ./$DIST_PATH/
browserify src/h265webjs.js -o ./$DIST_PATH/h265webjs_tmp.js
terser ./$DIST_PATH/h265webjs_tmp.js -c pure_funcs=[${REMOVE_FUNCS}],toplevel=true -m -o ./$DIST_PATH/h265webjs-${VERSION}.js
cp -r src/index.js ./$DIST_PATH/
rm ./$DIST_PATH/h265webjs_tmp.js
cp -r ./$DIST_PATH/* ./demo/$DIST_PATH/
cp ./src/decoder/raw-parser.js ./$DIST_PATH/ # extension module

#browserify worker-fetch.js -o ./dist/worker-fetch-dist.js
#browserify worker-parse.js -o ./dist/worker-parse-dist.js
#cat src/decoder/missile.js src/decoder/dc-worker.js > ./dist/dc-worker-dist.tmp.js
#terser ./dist/dc-worker-dist.tmp.js -c pure_funcs=[${REMOVE_FUNCS}],toplevel=true -m -o ./dist/dc-worker-dist.js

echo ""
echoLog "==========================================================="
echoLog "==========================================================="
echoLog "========    Step.2 START EXECUTE BUILD WASM ==============="
echoLog "==========================================================="
echoLog "==========================================================="
# if [[ $H265WEBJS_COMPILE_MULTI_THREAD_SHAREDBUFFER -eq 1 ]]; then
bash missile-rebuild.sh $H265WEBJS_COMPILE_MULTI_THREAD_SHAREDBUFFER $DIST_PATH
# else
# fi

exit 0

####################### EXIT ############################
browserify play.js -o ./$DIST_PATH/dist-play.js

echo ""
echoLog "==========================================================="
echoLog "==========================================================="
echoLog "========    Step.3 START CLEAM TEMP FILEl ================="
echoLog "==========================================================="
echoLog "==========================================================="

rm ./$DIST_PATH/h265webjs_tmp.js.tmp*
rm ./$DIST_PATH/dist-play.js.tmp*

echo ""
echoLog "==========================================================="
echoLog "==========================================================="
echoLog "========    OK Finished ==================================="
echoLog "==========================================================="
echoLog "==========================================================="
echo ""







