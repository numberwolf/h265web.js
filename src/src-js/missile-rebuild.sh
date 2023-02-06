#!/bin/bash
source ./version.sh

IS_MULTI_THREAD_REBUILD=${1}
DISTPATH=${2}

BASEPATH=`pwd`
# DISTPATH="${BASEPATH}/dist"
ADD_MISSILE="${BASEPATH}/src/decoder/add-missile.js"

#FILE="${BASEPATH}/src/decoder/missile-512mb.js"
FILE_LIST=(
src/decoder/missile-${WASM_VERSION}.js
src/decoder/missile.js
src/decoder/missile-120func-${WASM_VERSION}.js
src/decoder/missile-120func.js
src/decoder/missile-256mb-${WASM_VERSION}.js
src/decoder/missile-256mb.js
src/decoder/missile-512mb-${WASM_VERSION}.js
src/decoder/missile-512mb.js
)

FILE_CP_LIST=(
src/decoder/missile-${WASM_VERSION}.wasm
src/decoder/missile-120func-${WASM_VERSION}.wasm
src/decoder/missile-256mb-${WASM_VERSION}.wasm
src/decoder/missile-512mb-${WASM_VERSION}.wasm
)

MULTI_FILE_LIST=(
src/decoder/missile-multi-thread-${WASM_VERSION}.js
src/decoder/missile-multi-thread.js
)

MULTI_FILE_CP_LIST=(
src/decoder/missile-multi-thread-${WASM_VERSION}.fetch.js
src/decoder/missile-multi-thread-${WASM_VERSION}.html.mem
src/decoder/missile-multi-thread-${WASM_VERSION}.wasm
src/decoder/missile-multi-thread-${WASM_VERSION}.worker.js
)

if [[ $IS_MULTI_THREAD_REBUILD -eq 0 ]]; then
    for file_path in ${FILE_LIST[@]}; do
        file_name=`echo -e $file_path | awk -F '\/' '{print $NF}'`
        input_path=$BASEPATH/$file_path
        output_path=$DISTPATH/$file_name

        cp $input_path $output_path
    done
    for file_path in ${FILE_CP_LIST[@]}; do
        file_name=`echo -e $file_path | awk -F '\/' '{print $NF}'`
        input_path=$BASEPATH/$file_path
        output_path=$DISTPATH/$file_name
        cp $input_path $output_path
    done
else
    for file_path in ${MULTI_FILE_LIST[@]}; do
        file_name=`echo -e $file_path | awk -F '\/' '{print $NF}'`
        input_path=$BASEPATH/$file_path
        output_path=$DISTPATH/$file_name

        awk -v get_tag=0 -v idx=0 -v idx2=0 -v idx3=0 '{
            if (FILENAME == ARGV[1]) {
                if (match($0,/(worker sent an unknown command)/)) {
                    get_tag=1
                } else {
                    if (get_tag == 0) {
                        arr1[idx]=$0
                        idx++
                    } else {
                        arr2[idx2]=$0
                        idx2++
                    }
                }
            } else if (FILENAME == ARGV[2]) {
                arr3[idx3]=$0
                idx3++
            }
        } END { 
            for(i=0;i<idx;i++) {
                print arr1[i]
            }
            for(i=0;i<idx3;i++) {
                print arr3[i]
            }
            for(i=0;i<idx2;i++) {
                print arr2[i]
            }
        }' $input_path $ADD_MISSILE > $output_path

        echo "OK build ${output_path}"
    done

    for file_path in ${MULTI_FILE_CP_LIST[@]}; do
        file_name=`echo -e $file_path | awk -F '\/' '{print $NF}'`
        input_path=$BASEPATH/$file_path
        output_path=$DISTPATH/$file_name
        cp $input_path $output_path
    done
fi


# for file_path in ${FILE_LIST[@]}; do
#     file_name=`echo -e $file_path | awk -F '\/' '{print $NF}'`
#     input_path=$BASEPATH/$file_path
#     output_path=$DISTPATH/$file_name

#     if [[ $IS_MULTI_THREAD_REBUILD -eq 0 ]]; then
#         cp $input_path $output_path
#         continue
#     fi

#     awk -v get_tag=0 -v idx=0 -v idx2=0 -v idx3=0 '{
#         if (FILENAME == ARGV[1]) {
#             if (match($0,/(worker sent an unknown command)/)) {
#                 get_tag=1
#             } else {
#                 if (get_tag == 0) {
#                     arr1[idx]=$0
#                     idx++
#                 } else {
#                     arr2[idx2]=$0
#                     idx2++
#                 }
#             }
#         } else if (FILENAME == ARGV[2]) {
#             arr3[idx3]=$0
#             idx3++
#         }
#     } END { 
#         for(i=0;i<idx;i++) {
#             print arr1[i]
#         }
#         for(i=0;i<idx3;i++) {
#             print arr3[i]
#         }
#         for(i=0;i<idx2;i++) {
#             print arr2[i]
#         }
#     }' $input_path $ADD_MISSILE > $output_path

#     echo "OK build ${output_path}"
# done


echo $FINISHED
