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
LIB_OUT_DIR="${NOWPATH}/lib"

# STEP.0
emmake make clean
rm -rf ${LIB_OUT_DIR}

# emconfigure ./configure --cc="emcc" --enable-cross-compile --target-os=none --arch=x86_32 --cpu=generic \
#    --disable-ffplay --disable-ffprobe --disable-asm --disable-doc --disable-devices --disable-pthreads --disable-w32threads --disable-network \
#    --disable-hwaccels --disable-parsers --disable-bsfs --disable-debug --disable-protocols --disable-indevs --disable-outdevs --enable-protocol=file

# STEP.1
#emconfigure ./configure --cc="emcc" --enable-cross-compile --target-os=none --arch=x86_32 --cpu=generic \
#    --disable-ffplay --disable-ffprobe --disable-asm --disable-doc --disable-devices --disable-pthreads --disable-w32threads --disable-network \
#    --disable-hwaccels --disable-parsers --disable-bsfs --disable-debug --disable-protocols --disable-indevs --disable-outdevs --disable-protocol=file \
#    --disable-swresample --disable-swscale --disable-avformat --disable-avfilter --disable-avresample --disable-postproc --disable-programs

#  --disable-libxcd \

emconfigure ./configure --cc="emcc" --enable-cross-compile \
 --ar=emar \
 --cxx=em++ \
 --objcc=emcc \
 --dep-cc=emcc \
 \
 --extra-libs='-lpthread' \
 --extra-cflags="-O3 -s USE_PTHREADS=5" \
 \
 --target-os=none \
 --arch=x86_32 \
 --cpu=generic \
 --disable-all \
 --disable-runtime-cpudetect \
 --disable-ffplay \
 --disable-ffprobe \
 --disable-securetransport \
 --disable-asm \
 --disable-doc \
 --disable-devices \
 --enable-pthreads \
 --disable-w32threads \
 --disable-os2threads \
 --disable-network \
 --disable-hwaccels \
 --disable-parsers \
 --disable-bsfs \
 --disable-debug \
 --disable-protocols \
 --disable-indevs \
 --disable-outdevs \
 --disable-vaapi \
 --disable-dxva2 \
 --disable-avfilter \
 --disable-avresample \
 --disable-postproc \
 --disable-programs \
 --disable-muxers \
 --disable-filters \
 --disable-encoders \
 --disable-bzlib \
 --disable-xlib \
 --disable-lzma \
 --disable-zlib \
 --disable-iconv \
 --disable-sdl2 \
 \
 --enable-avformat \
 --enable-avcodec \
 --enable-avutil \
 --enable-demuxer=mpegts \
 --enable-demuxer=mpegtsraw \
 --enable-demuxer=mpegps \
 --enable-demuxer=mpegvideo \
 --enable-demuxer=mov \
 --enable-demuxer=matroska \
 --enable-demuxer=avi \
 --enable-demuxer=flv \
 --enable-demuxer=live_flv \
 --enable-demuxer=hevc \
 --enable-demuxer=h264 \
 --enable-demuxer=m4v \
 --enable-demuxer=mp3 \
 --enable-demuxer=pcm_alaw \
 --enable-demuxer=pcm_mulaw \
 --enable-parser=h264 \
 --enable-parser=hevc \
 --enable-bsf=hevc_mp4toannexb \
 --enable-decoder=hevc \
 --enable-swscale \
 --enable-decoder=aac \
 --enable-decoder=mp3 \
 --enable-decoder=pcm_alaw \
 --enable-decoder=pcm_mulaw \
 --enable-swresample
 #--enable-avresample # WARNING: Building with deprecated library libavresample
# --enable-decoder=aac \
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


    #--disable-hwaccels --disable-parsers --disable-bsfs --disable-debug --disable-protocols --disable-indevs --disable-outdevs --enable-protocol=file --enable-protocol=http --enable-protocol=http
    #--disable-ffplay --disable-ffprobe --disable-asm --disable-doc --disable-devices --disable-pthreads --disable-w32threads --disable-network \


# STEP.2
# ffbuild/config.mak 
#- AR=ar
#+ AR=emar
#- RANLIB=ranlib
#+ #RANLIB=ranlib
emmake make

# STEP.3
cp ffmpeg_g ffmpeg
# # 需要拷贝一个.bc后缀，因为emcc是根据后缀区分文件格式的
cp ffmpeg_g ffmpeg.bc
emcc -s TOTAL_MEMORY=33554432 ffmpeg.bc -o ffmpeg.html

# STEP.4
if [ ! -d $LIB_OUT_DIR ]; then
    mkdir -p $LIB_OUT_DIR
fi

for val in ${FRAMEWORK_NAME[@]}; do
    cp ${NOWPATH}/${val}/*.a $LIB_OUT_DIR
done

ls ${LIB_OUT_DIR}/*.a |  while read -r LINE; do
    #pre_name=`echo "${LINE}" | awk -F '.' '{print $1}'`
    pre_name=`echo "${LINE}" | sed 's/\.a$//g'`
    cp $LINE $pre_name".bc"
done




