#include "about.h"

#include <stdio.h>
#include <string.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <netinet/in.h>
#include <stdlib.h>

#ifdef __EMSCRIPTEN__
#include <emscripten/fetch.h>
#include <emscripten.h>
#endif

#define MAXLINE 500

//void downloadSucceeded(emscripten_fetch_t *fetch) {
//    printf("Finished downloading %llu bytes from URL %s.\n", fetch->numBytes, fetch->url);
//    // The data is now available at fetch->data[0] through fetch->data[fetch->numBytes-1];
//    for (size_t i = 0; i < fetch->numBytes; ++i) {
//        printf("%c", fetch->data[i]);
//    }
//    printf("\n");
//
//    emscripten_fetch_close(fetch); // Free data associated with the fetch.
//}
//
//void downloadFailed(emscripten_fetch_t *fetch) {
//    printf("Downloading %s failed, HTTP failure status code: %d.\n", fetch->url, fetch->status);
//    emscripten_fetch_close(fetch); // Also free data on failure.
//}
//
//int testRequest() {
//    emscripten_fetch_attr_t attr;
//    emscripten_fetch_attr_init(&attr);
//    strcpy(attr.requestMethod, "GET");
//    attr.attributes = EMSCRIPTEN_FETCH_LOAD_TO_MEMORY;
//    attr.onsuccess = downloadSucceeded;
//    attr.onerror = downloadFailed;
//    emscripten_fetch(&attr, "http://apih265webjs.yuveye.com/?c=domainLimit&a=check&t=123124214124");
//
//    printf("[testRequest] all ok now\n");
//    return 0;
//}

void introduce_mine() {
    //testRequest();

    if (IS_INTRODUCE_MINE <= 0) {
        printf("/*********************************************************\n");
        printf(" _     ___   __ _____             _      _            \n"
               "| |   |__ \\ / /| ____|           | |    (_)          \n"
               "| |__    ) / /_| |____      _____| |__   _ ___        \n"
               "| '_ \\  / / '_ \\___ \\ \\ /\\ / / _ \\ '_ \\ | / __|\n"
               "| | | |/ /| (_) |__) \\ V  V /  __/ |_) || \\__ \\    \n"
               "|_| |_|____\\___/____/ \\_/\\_/ \\___|_.__(_) |___/   \n"
               "                                       _/ |           \n"
               "                                      |__/            \n");
        printf(" * [h265web.js] h265web.js is permanent free & 本播放内核完全免费 可商业化!\n");
        printf(" * [h265web.js] Author & 作者: %s\n", "Numberwolf - ChangYanlong");
        printf(" * [h265web.js] QQ Group & 技术支持群: %s\n", "925466059");
        printf(" * [h265web.js] WeChat & 微信: %s\n", "numberwolf11");
        printf(" * [h265web.js] Discord: %s\n", "numberwolf#8694");
        printf(" * [h265web.js] Email & 邮箱: %s\n", "porschegt23@foxmail.com");
        printf(" * [h265web.js] Blog & 博客: %s\n", "https://www.jianshu.com/u/9c09c1e00fd1");
        printf(" * [h265web.js] Github: %s\n", "https://github.com/numberwolf");
        printf(" * [h265web.js] h265web.js: %s\n", "https://github.com/numberwolf/h265web.js");

        IS_INTRODUCE_MINE = 1;
    }
}

void introduce_player() {
    printf("/********************************************************* \n");
    printf(" * \n");
    printf(" * Author: %s\n",    "Numberwolf - ChangYanlong");
    printf(" * 小老虎的开源技术支持群: %s\n", "925466059");
    printf(" * 微信: %s\n", "numberwolf11");
    printf(" * Discord: %s\n",   "numberwolf#8694");
    printf(" * 邮箱: %s\n",       "porschegt23@foxmail.com");
    printf(" * 博客: %s\n",       "https://www.jianshu.com/u/9c09c1e00fd1");
    printf(" * Github: %s\n",    "https://github.com/numberwolf");
    printf(" * \n");
    printf(" * 作者: %s\n",       "小老虎(Numberwolf)(常炎隆)");
    printf(" * QQ Group Number: %s\n",	  "925466059");
    printf(" * Wechat number: %s\n", "numberwolf11");
    printf(" * Discord: %s\n",   "numberwolf#8694");
    printf(" * E-Mail: %s\n",    "porschegt23@foxmail.com");
    printf(" * Github: %s\n",    "https://github.com/numberwolf");
    printf(" * \n");
    printf(" * \n");
    printf(" * \n");
    printf(" * \n");
    printf(" * \n");
    printf(" * !!!商业化用户须知(扩展协议):    如同意则可以使用\n");
    printf(" * 0) 本产品完全免费、开源, 但是需要遵循以下条件\n");
    printf(" * 1) 请加入[小老虎的开源技术支持群]QQ群报备: 925466059\n");
    printf(" * 2) 提供报备企业名称单位(如不方便可单独说明)\n");
    printf(" **********************************************************/\n");
}
