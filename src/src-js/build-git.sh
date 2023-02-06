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
## Stargazers over time
#[![Stargazers over time](https://starcharts.herokuapp.com/numberwolf/h265web.js.svg)](https://starcharts.herokuapp.com/numberwolf/h265web.js)
# to ../playertest
 # 1150  npm install --save flv.js
 # 1151  npm install --save-dev video.js
set -x
source ./version.sh

#PLAYER_TEST_DIR="../playertest"
PLAYER_TEST_DIR="../h265web.js"
PLAYER_TEST_DIR_RESOURCE="${PLAYER_TEST_DIR}/resource"
PLAYER_TEST_DIR_DIST="${PLAYER_TEST_DIR}/dist"
PLAYER_TEST_DIR_DIST_MULTI="${PLAYER_TEST_DIR}/dist-multi-thread"
# PLAYER_TEST_DIR_EXP="${PLAYER_TEST_DIR}/example"
PLAYER_TEST_DIR_EXP_NORMAL="${PLAYER_TEST_DIR}/example_normal"
PLAYER_TEST_DIR_SRC="${PLAYER_TEST_DIR}/src"
# rm $PLAYER_TEST_DIR_DIST/*.wasm
# rm $PLAYER_TEST_DIR_DIST/*.js

PLAYER_TEST_DIR_VUE3_VITE="${PLAYER_TEST_DIR}/example_vue3_vite"
PLAYER_TEST_DIR_VUE3="${PLAYER_TEST_DIR}/example_vue3"
PLAYER_TEST_DIR_VUE2="${PLAYER_TEST_DIR}/example_vue2"

cp -r ./resource/* $PLAYER_TEST_DIR_RESOURCE/

#cp ./dist/worker-*.js $PLAYER_TEST_DIR_DIST/
cp ./dist/raw-parser.js $PLAYER_TEST_DIR_DIST/
cp ./dist/index.js $PLAYER_TEST_DIR_DIST/
cp ./dist/h265webjs-${VERSION}.js $PLAYER_TEST_DIR_DIST/
cp ./dist/missile* $PLAYER_TEST_DIR_DIST/

rm -rf $PLAYER_TEST_DIR_DIST_MULTI

cp -r ./dist-multi-thread $PLAYER_TEST_DIR_DIST_MULTI

# rm -rf $PLAYER_TEST_DIR_EXP/dist
# cp -r $PLAYER_TEST_DIR_DIST $PLAYER_TEST_DIR_EXP/

# rm -rf $PLAYER_TEST_DIR_EXP/player-view
# cp -r player-view $PLAYER_TEST_DIR_EXP/

rm -rf $PLAYER_TEST_DIR_EXP_NORMAL/dist/*
# cp -r $PLAYER_TEST_DIR_DIST $PLAYER_TEST_DIR_EXP_NORMAL/

rm -rf $PLAYER_TEST_DIR_EXP_NORMAL/dist-multi-thread/*
# cp -r $PLAYER_TEST_DIR_DIST_MULTI $PLAYER_TEST_DIR_EXP_NORMAL/

rm -rf $PLAYER_TEST_DIR_EXP_NORMAL/player-view
cp -r player-view $PLAYER_TEST_DIR_EXP_NORMAL/


rm -rf $PLAYER_TEST_DIR_VUE3_VITE/public/dist/*
# cp -r $PLAYER_TEST_DIR_DIST $PLAYER_TEST_DIR_VUE3_VITE/public/dist

rm -rf $PLAYER_TEST_DIR_VUE3/public/dist/*
# cp -r $PLAYER_TEST_DIR_DIST $PLAYER_TEST_DIR_VUE3/public/dist

rm -rf $PLAYER_TEST_DIR_VUE2/public/dist/*
# cp -r $PLAYER_TEST_DIR_DIST $PLAYER_TEST_DIR_VUE2/public/dist

cp README* $PLAYER_TEST_DIR/

rm -rf $PLAYER_TEST_DIR_SRC/*
cp -r src $PLAYER_TEST_DIR_SRC/
cp ./package.json $PLAYER_TEST_DIR_SRC/
cp ./package-lock.json $PLAYER_TEST_DIR_SRC/
cp ./build.sh $PLAYER_TEST_DIR_SRC/
cp ./version.sh $PLAYER_TEST_DIR_SRC/
cp ./play.js $PLAYER_TEST_DIR_SRC/
cp ./worker-*.js $PLAYER_TEST_DIR_SRC/

# cd $PLAYER_TEST_DIR_EXP
# npm start








