#!/bin/bash
set -x
#VERSION='v20211104'
source ./version.sh

NOWPATH=`pwd`
#FFMPEG_DIR="${NOWPATH}/../ffmpeg-3.4.6"
FFMPEG_DIR="${NOWPATH}/../FFmpeg-n4.2.3"
#FFMPEG_DIR="${NOWPATH}/../FFmpeg-n4.3.1"
LIB_PATH="${FFMPEG_DIR}/lib"
MEM_SIZE=`expr 2 \* 1024 \* 1024 \* 1024`
#MEM_SIZE=`expr 128 \* 1024 \* 1024`
OUTPUT="${NOWPATH}/output"

ENTRY_PATH="${NOWPATH}/../../VideoMissilePlayer"
ENTRY_TS_PATH="${NOWPATH}/../../VideoMissileTsDemuxer"
FNAME_PRE="missile-multi-thread"
FNAME="${FNAME_PRE}-${VERSION}"

rm $OUTPUT/*

#
# build
# WARNING: Building with deprecated library libavresample
#
# emcc web.c process.c about.c \
# ${LIB_PATH}/libavformat.bc \
# ${LIB_PATH}/libavutil.bc \
#${LIB_PATH}/libswresample.bc \

#${LIB_PATH}/libswscale.bc \
#${LIB_PATH}/libswresample.bc \
#
# ${LIB_PATH}/libswscale.bc \
#--llvm-lto 1 \
emcc web_wasm.c \
about.c \
seek_desc.c \
sniff_stream.c \
sniff_httpflv.c \
sniff_g711core.c \
vcodec.c \
ts_parser.c \
utils/ts_utils.c \
utils/secret.c \
utils/tools.c \
utils/md5.c \
utils/common_string.c \
utils/av_err_code.c \
utils/common_av.c \
utils/av_dec_linklist.c \
decoder/avc.c \
decoder/hevc.c \
decoder/aac.c \
${LIB_PATH}/libavformat.bc \
${LIB_PATH}/libswscale.bc \
${LIB_PATH}/libavcodec.bc \
${LIB_PATH}/libavutil.bc \
${LIB_PATH}/libswresample.bc \
-I${FFMPEG_DIR} \
-O3 -s WASM=1 \
-flto \
-s FETCH=1 \
-s USE_PTHREADS=1 \
-s PTHREAD_POOL_SIZE=10 \
-o ${OUTPUT}/${FNAME}.html \
-s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall", "cwrap", "addFunction", "removeFunction"]' \
-s RESERVED_FUNCTION_POINTERS=35 \
-s ALLOW_TABLE_GROWTH \
-s TOTAL_MEMORY=${MEM_SIZE} \
-s MEMFS_APPEND_TO_TYPED_ARRAYS=1 \
-s ASSERTIONS=3
#-Werror

# fetch下面
#-s USE_PTHREADS=1 \
#-s PTHREAD_POOL_SIZE=10 \

#-s USE_PTHREADS=1 \
#-s PTHREAD_POOL_SIZE=10 \

# -Os
# -s ALLOW_MEMORY_GROWTH=1 \
# -s PTHREAD_POOL_SIZE=10 \
# -s RESERVED_FUNCTION_POINTERS=14 \

# https://emscripten.org/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html#interacting-with-code-call-function-pointers-from-c

#-s SAFE_HEAP=1
#-s FORCE_FILESYSTEM=1
#MISSILE_FILE_NAME=${FNAME}.js

FNAME_FORMAT="${FNAME}_format"

MISSILE_JS=${OUTPUT}/${FNAME}.js
MISSILE_FORMAT_JS=${OUTPUT}/${FNAME_FORMAT}.js  # 格式化的代码文件输出目录

#echo -e "module.exports = Module" >> $MISSILE_JS
echo -e "var ENVIRONMENT_IS_PTHREAD = true;" > "${MISSILE_JS}.head"
cat $MISSILE_JS >> "${MISSILE_JS}.head"
mv "${MISSILE_JS}.head" $MISSILE_JS

MISSILE_WASM=${OUTPUT}/${FNAME}.wasm

#rm $ENTRY_PATH/*
cp $MISSILE_WASM ${ENTRY_PATH}/src/decoder
#cp $MISSILE_JS ${ENTRY_PATH}/src/decoder
js-beautify $MISSILE_JS > ${MISSILE_FORMAT_JS}   # 格式化 missile-v20220101.js
cp $MISSILE_FORMAT_JS ${ENTRY_PATH}/src/decoder/${FNAME}.js # 格式化的代码 missile-v20220101.js 拷贝到decoder
cp $OUTPUT/$FNAME.worker.js ${ENTRY_PATH}/src/decoder
cp $FNAME.fetch.js ${ENTRY_PATH}/src/decoder
cp $OUTPUT/$FNAME.html.mem ${ENTRY_PATH}/src/decoder

cd ${ENTRY_PATH}/src/decoder
rm ${FNAME_PRE}.js
#ln -s ${MISSILE_JS} ${FNAME_PRE}.js
#cp ${MISSILE_JS} ${FNAME_PRE}.js
cp $MISSILE_FORMAT_JS ${FNAME_PRE}.js   # 格式化的代码文件拷贝过去 missile.js


#cp $MISSILE_WASM ${ENTRY_TS_PATH}/demuxer
#cp $MISSILE_JS ${ENTRY_TS_PATH}/demuxer

