PROJECT(H265WEB_JS_CHANGYANLONG)
CMAKE_MINIMUM_REQUIRED(VERSION 2.6)
SET(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11")

MESSAGE(STATUS "FFmpeg-QuQi-Analyzer")
MESSAGE(STATUS "porschegt23@foxmail.com")
MESSAGE(STATUS "operation system is ${CMAKE_SYSTEM}")

SET(CMAKE_BUILD_TYPE "Debug")

#ADD_SUBDIRECTORY(src)

IF (CMAKE_SYSTEM_NAME MATCHES "Linux")
    MESSAGE(STATUS "current platform: Linux ")
ELSEIF (CMAKE_SYSTEM_NAME MATCHES "Windows")
    MESSAGE(STATUS "current platform: Windows")
ELSEIF (CMAKE_SYSTEM_NAME MATCHES "Android")
    MESSAGE(STATUS "current platform: Android")
ELSEIF (CMAKE_SYSTEM_NAME MATCHES "Darwin")
    MESSAGE(STATUS "current platform: Darwin")
ELSE ()
    MESSAGE(STATUS "other platform: ${CMAKE_SYSTEM_NAME}")
ENDIF (CMAKE_SYSTEM_NAME MATCHES "Linux")

ADD_EXECUTABLE(
        main
        main.c # TODO
        web_capi.c # TODO
        about.c
        seek_desc.c
        sniff_remux_mpeg4.c
        sniff_stream.c
        sniff_httpflv.c
        sniff_g711core.c
        vcodec.c
        ts_parser.c
        utils/ts_utils.c
        utils/secret.c
        utils/tools.c
        utils/md5.c
        utils/common_string.c
        utils/av_err_code.c
        utils/common_av.c
        utils/av_dec_linklist.c
        decoder/avc.c
        decoder/hevc.c
        decoder/aac.c
)

INCLUDE_DIRECTORIES(./)
INCLUDE_DIRECTORIES(../)
INCLUDE_DIRECTORIES(/usr/local/include/)

link_libraries(avcodec)
link_libraries(avformat)
# link_libraries(avdevice)
# link_libraries(avfilter)
link_libraries(avutil)
link_libraries(swresample)
link_libraries(swscale)
# link_libraries(postproc)

link_libraries(z)
link_libraries(pthread)
link_libraries(lzma)

target_link_libraries(main avcodec)
target_link_libraries(main avformat)

# target_link_libraries(main avdevice)
# target_link_libraries(main avfilter)

target_link_libraries(main avutil)

target_link_libraries(main swresample)
target_link_libraries(main swscale)
# target_link_libraries(main postproc)
# target_link_libraries(main x264)



#INSTALL(
#    TARGETS Main
#    RUNTIME DESTINATION bin
#    LIBRARY DESTINATION lib
#    ARCHIVE DESTINATION lib
#)

