#!/bin/bash
set -x

# COMMON_FILTERS = scale crop overlay
# COMMON_DEMUXERS = matroska ogg avi mov flv mpegps image2 mp3 concat
# COMMON_DECODERS = \
# 	mpeg2video mpeg4 h264 hevc \
# 	png mjpeg \
# 	mp3 ac3 aac

NOWPATH=`pwd`
FRAMEWORK_NAME=(
libavcodec
libavdevice
libavfilter
libavformat
libavresample
libavutil
libpostproc
libswresample
libswscale
)
LIB_OUT_DIR="${NOWPATH}/lib-cmd"
BIN_OUT_DIR="${NOWPATH}/bin-cmd"

# STEP.0
emmake make clean
rm -rf ${LIB_OUT_DIR}
rm -rf ${BIN_OUT_DIR}

if [ ! -d $BIN_OUT_DIR ]; then
    mkdir -p $BIN_OUT_DIR
fi

# --disable-runtime-cpudetect \
# --disable-securetransport \
# --disable-asm \
# --disable-doc \
# --disable-devices \
# --disable-pthreads \
# --disable-w32threads \
# --disable-os2threads \
# --disable-network \
# --disable-hwaccels \
# --disable-parsers \
# --disable-bsfs \
# --disable-debug \
# --disable-protocols \
# --disable-indevs \
# --disable-outdevs \
# --disable-vaapi \
# --disable-dxva2 \
# --disable-avfilter \
# --disable-avresample \
# --disable-postproc \
# --disable-programs \
# --disable-muxers \
# --disable-demuxers \
# --disable-filters \
# --disable-encoders \
# --disable-bzlib \
# --disable-xlib \
# --disable-lzma \
# --disable-zlib \
# --disable-iconv \
# --disable-sdl2 \

#emconfigure ./configure --cc="emcc" --enable-cross-compile --target-os=none --arch=x86_32 --cpu=generic \
# --disable-ffplay --disable-ffprobe \
# --disable-asm --disable-devices \
# --disable-pthreads \
# --disable-w32threads \
# --disable-os2threads \
# --disable-network \
# --disable-hwaccels \
# --disable-parsers \
# --disable-bsfs \
# --disable-debug \
# --disable-protocols \
# --disable-indevs \
# --disable-outdevs \
# --disable-vaapi \
# --disable-dxva2 \
# --disable-avfilter \
# --disable-avresample \
# --disable-swresample \
# --disable-swscale \
# --disable-postproc \
# --disable-muxers \
# --disable-demuxers \
# --disable-filters \
# --disable-decoders \
# --disable-encoders \
# --disable-bzlib \
# --disable-xlib \
# --disable-lzma \
# --disable-zlib \
# --disable-iconv \
# --disable-sdl2 \
# --enable-protocol=file \
# --enable-ffmpeg \
# \
# --enable-avformat \
# --enable-avcodec \
# --enable-avutil \
# --enable-demuxer=mov \
# --enable-muxer=mov \
# --enable-demuxer=mpeg \
# --enable-muxer=mpeg \
# --enable-demuxer=mpegts \
# --enable-muxer=mpegts \
# --enable-demuxer=mpegtsraw \
# --enable-muxer=mpegtsraw \
# --enable-demuxer=mpegps \
# --enable-muxer=mpegps \
# --enable-demuxer=avi \
# --enable-muxer=avi \
# --enable-demuxer=flv \
# --enable-muxer=flv \
# --enable-demuxer=hls \
# --enable-muxer=hls \
# --enable-demuxer=gif \
# --enable-muxer=gif \
# --enable-muxer=rawvideo \
# --enable-demuxer=h264 \
# --enable-muxer=h264 \
# --enable-demuxer=hevc \
# --enable-muxer=hevc \
# --enable-demuxer=aac \
# --enable-muxer=aac \
# --enable-demuxer=mp3 \
# --enable-muxer=mp3

#--enable-decoder=hevc \
#
# ^
# mov aac swresample 其实可以去掉,只是为了兼容部分特殊情况
# 特殊情况下去掉 可以弄出一个精简版本
# mpeg ts相关去掉也可以
#


 #--enable-decoder=h264 \
 #--enable-demuxer=mpegtsraw \
 #--enable-demuxer=mp3 \
 #--enable-demuxer=aac \
 #--enable-demuxer=mpeg \
 #--enable-demuxer=mov \
 #--enable-demuxer=avi \

 #--enable-demuxer=mov \
 #--enable-demuxer=avi \
 #--enable-demuxer=mpeg \
 #--enable-demuxer=mpegps \
 #--enable-demuxer=flv \
 #--enable-decoder=h264 \
 #--enable-decoder=hevc
 
 #--enable-swscale
 #--enable-decoder=hevc \

# matroska ogg avi mov flv mpegps image2 mp3 concat
# --prefix=$BIN_OUT_DIR
make clean
#emconfigure ./configure --cc="emcc" \
#--enable-cross-compile --target-os=none --arch=x86_64 \
#--cpu=generic --disable-ffplay --disable-ffprobe  \
#--disable-asm --disable-doc --disable-devices --disable-pthreads \
#--disable-w32threads --disable-network --disable-hwaccels \
#--disable-parsers --disable-bsfs --disable-debug --disable-protocols \
#--disable-indevs --disable-outdevs --enable-protocol=file \
#--enable-small

#--disable-filters \
#--disable-avfilter \
#--disable-encoders \
#--disable-decoders \
#--disable-avresample \
#--disable-swresample \
#--disable-swscale
#--disable-postproc

emconfigure ./configure --cc="emcc" \
--enable-cross-compile --target-os=none --arch=x86_64 \
--cpu=generic --disable-ffplay --disable-ffprobe --disable-ffserver \
--disable-asm --disable-doc --disable-devices --disable-pthreads \
--disable-w32threads --disable-network --disable-hwaccels \
--disable-parsers --disable-bsfs --disable-debug --disable-protocols \
--disable-indevs --disable-outdevs --enable-protocol=file
#  --enable-small

# STEP.2
# ffbuild/config.mak 
#- AR=ar
#+ AR=emar
#- RANLIB=ranlib
#+ #RANLIB=ranlib
#emmake make
make -j8
#
#
### STEP.3
cp ffmpeg_g ffmpeg
### # 需要拷贝一个.bc后缀，因为emcc是根据后缀区分文件格式的
cp ffmpeg_g ffmpeg.bc
##



#-Os -s WASM=1 \
#-s FETCH=1 \
#-o ${OUTPUT}/${FNAME}.html \
#-s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall", "cwrap", "addFunction"]' \
#-s RESERVED_FUNCTION_POINTERS=14 \
#-s ALLOW_MEMORY_GROWTH=1 \
#-s TOTAL_MEMORY=${MEM_SIZE} \
#-s MEMFS_APPEND_TO_TYPED_ARRAYS=1
##-s SAFE_HEAP=1
##-s FORCE_FILESYSTEM=1

MEM_SIZE=`expr 512 \* 1024 \* 1024`
##
emcc -s ASSERTIONS=1 -s TOTAL_MEMORY=${MEM_SIZE} -s ALLOW_MEMORY_GROWTH=1 \
-s WASM=1 -O2 \
-s VERBOSE=0 \
-s EXIT_RUNTIME=1 \
-v ffmpeg.bc \
-o ffmpeg3.js --pre-js ffmpeg_pre.js --post-js ffmpeg_post.js

#cp ffmpeg.js /Users/numberwolf/Documents/webroot/VideoMissile/VideoTranscoder/
#cp ffmpeg.wasm /Users/numberwolf/Documents/webroot/VideoMissile/VideoTranscoder/

cp ffmpeg3.js /Users/numberwolf/Documents/webroot/VideoMissile/VideoTranscoder/
cp ffmpeg3.wasm /Users/numberwolf/Documents/webroot/VideoMissile/VideoTranscoder/
cp ffmpeg3.js /Users/numberwolf/Documents/webroot/VideoMissile/VideoTranscoder/videoconverter.js-origin/demo/
cp ffmpeg3.wasm /Users/numberwolf/Documents/webroot/VideoMissile/VideoTranscoder/videoconverter.js-origin/demo/
