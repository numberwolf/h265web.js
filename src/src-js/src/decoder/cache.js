/********************************************************* 
 * LICENSE: LICENSE-Free_CN.MD
 * 
 * Author: Numberwolf - ChangYanlong
 * QQ: 531365872
 * QQ Group:925466059
 * Wechat: numberwolf11
 * Discord: numberwolf#8694
 * E-Mail: porschegt23@foxmail.com
 * Github: https://github.com/numberwolf/h265web.js
 * 
 * 作者: 小老虎(Numberwolf)(常炎隆)
 * QQ: 531365872
 * QQ群: 531365872
 * 微信: numberwolf11
 * Discord: numberwolf#8694
 * 邮箱: porschegt23@foxmail.com
 * 博客: https://www.jianshu.com/u/9c09c1e00fd1
 * Github: https://github.com/numberwolf/h265web.js
 * 
 **********************************************************/
const CACHE_YUV = require('./cacheYuv');
global.CACHE_APPEND_STATUS_CODE = {
	FAILED: -1, // 异常
	OVERFLOW: -2, // 再加就溢出了
	OK: 0, // 正常 一般不用
	NOT_FULL: 1, // 不满
	FULL: 2, // 刚满
	NULL: 3
};

// buffer
module.exports = (limit=60) => { // default is 2s by 30fps
	let cacheModule = {
		limit: limit,
		/**
		 * CacheYuvStruct
		 * [
		 *	{pts, width, height, imageBufferY, imageBufferB, imageBufferR}, {}, ..., {}] 0 sec / index
		 * 	...
		 * ]
		 */
		yuvCache: []
	};
	// by object
	cacheModule.appendCacheByCacheYuv = (cacheYuvObj) => {
		let pts = cacheYuvObj.pts;
		// console.log("cacheThread ----> appendCacheByCacheYuv ", cacheYuvObj);

		if (cacheModule.yuvCache.length >= cacheModule.limit) {
			return CACHE_APPEND_STATUS_CODE.OVERFLOW;
		}

		cacheModule.yuvCache.push(cacheYuvObj);
		if (cacheModule.yuvCache.length >= cacheModule.limit) {
			return CACHE_APPEND_STATUS_CODE.FULL;
		}

        return CACHE_APPEND_STATUS_CODE.NOT_FULL;
	};
	cacheModule.getState = () => {
		// console.log(cacheModule.yuvCache.length, cacheModule.limit);
		if (cacheModule.yuvCache.length <= 0) {
			return CACHE_APPEND_STATUS_CODE.NULL;
		} else if (cacheModule.yuvCache.length >= cacheModule.limit) {
			return CACHE_APPEND_STATUS_CODE.FULL;
		} else {
			return CACHE_APPEND_STATUS_CODE.NOT_FULL;
		}
	};
	cacheModule.cleanPipeline = () => {
		cacheModule.yuvCache.length = 0;
	};
	cacheModule.vYuv = () => {
		// console.log("==========> playFunc vYuv", cacheModule.yuvCache.length, cacheModule.limit);
		if (cacheModule.yuvCache.length <= 0) {
			return null;
		}
		return cacheModule.yuvCache.shift();
	};

	return cacheModule;
}
