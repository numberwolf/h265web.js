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

const def = require('../consts');
const Formats = [
	// {
	// 	format: 'avi', // regex match
	// 	value: 'mp4',
	// 	core: def.PLAYER_CORE_TYPE_CNATIVE
	// },
	{
		format: 'mp4', // regex match
		value: 'mp4',
		core: def.PLAYER_CORE_TYPE_CNATIVE
	},
	{
		format: 'mov',
		value: 'mp4',
		core: def.PLAYER_CORE_TYPE_CNATIVE
	},
	{
		format: 'mkv',
		value: 'mp4',
		core: def.PLAYER_CORE_TYPE_CNATIVE
	},
	{
		format: 'flv',
		value: 'flv',
		core: def.PLAYER_CORE_TYPE_CNATIVE
	},
	{
		format: 'm3u8',
		value: 'hls',
		core: def.PLAYER_CORE_TYPE_DEFAULT
	},
	{
		format: 'm3u',
		value: 'hls',
		core: def.PLAYER_CORE_TYPE_DEFAULT
	},
	{
		format: 'ts',
		value: 'ts',
		core: def.PLAYER_CORE_TYPE_DEFAULT
	},
	{
		format: 'ps',
		value: 'ts',
		core: def.PLAYER_CORE_TYPE_DEFAULT
	},
	{
		format: 'mpegts',
		value: 'ts',
		core: def.PLAYER_CORE_TYPE_DEFAULT
	},
	{
		format: 'hevc',
		value: 'raw265',
		core: def.PLAYER_CORE_TYPE_DEFAULT
	},
	{
		format: 'h265',
		value: 'raw265',
		core: def.PLAYER_CORE_TYPE_DEFAULT
	},
	{
		format: '265',
		value: 'raw265',
		core: def.PLAYER_CORE_TYPE_DEFAULT
	}
]; // httpflv

const Protocols = [
	{
		format: def.URI_PROTOCOL_HTTP, // regex match
		value: def.URI_PROTOCOL_HTTP_DESC,
	},
	{
		format: def.URI_PROTOCOL_WEBSOCKET,
		value: def.URI_PROTOCOL_WEBSOCKET_DESC,
	}
]; // Protocols

/**
 * I420 420P
 * @return [y, u, v]
 */
function frameDataAlignCrop(
	line1, line2, line3,
	width, height, 
	buf_y, buf_u, buf_v) 
{
	let align = line1 - width;
	if (align == 0) {
		return [buf_y, buf_u, buf_v];
	} else {
		let luma_size = width * height;
		let chroma_size = luma_size / 4;

		// let min_align = width % 4;
		// if (min_align > 0) {
		// 	width += min_align;
		// }

		let new_y = new Uint8Array(luma_size);
		let new_u = new Uint8Array(chroma_size);
		let new_v = new Uint8Array(chroma_size);

		let luma_w = width;
		let chroma_w = width / 2;

		// luma
		for (let i = 0; i < height; i++) {
			new_y.set(buf_y.subarray(i * line1, luma_w), i * height);
		}

		// chromaB
		for (let i = 0; i < height / 2; i++) {
			new_u.set(buf_u.subarray(i * line2, chroma_w), i * height / 2);
		}

		// chromaR
		for (let i = 0; i < height / 2; i++) {
			new_v.set(buf_v.subarray(i * line3, chroma_w), i * height / 2);
		}

		return [new_y, new_u, new_v];
	}
} // frameDataAlignCrop


function GetUriFormat(uri) {
	if (uri !== undefined && uri !== null) {
		for (let i = 0; i < Formats.length; i++) {
			const formatTag = Formats[i];
			const formatRegex = '\.' + formatTag.format;

			let patt = formatRegex;
			let n = uri.search(patt);

			if (n >= 0) {
				// alert(formatTag.value);
				return formatTag.value;
			} // end if
		} // end for
	}

	return Formats[0].value;
} // GetUriFormat

function GetFormatPlayCore(inputFormat) {
	if (inputFormat !== undefined && inputFormat !== null) { 
		for (let i = 0; i < Formats.length; i++) {
			const formatTag = Formats[i];
			if (formatTag.value === inputFormat) {
				return formatTag.core;
			} // end if
		} // end for
	}

	return Formats[0].core;
} // GetFormatPlayCore

function GetUriProtocol(uri) {
	if (uri !== undefined && uri !== null) {
		for (let i = 0; i < Protocols.length; i++) {
			const formatTag = Protocols[i];
			const formatRegex = formatTag.format + '[s]{0,}:\/\/';

			let patt = formatRegex;
			let n = uri.search(patt);

			if (n >= 0) {
				// alert(formatTag.value);
				return formatTag.value;
			} // end if
		} // end for
	}

	return Protocols[0].value;
} // GetUriFormat

function GetMsTime() {
    return new Date().getTime();
}

function GetScriptPath(foo) {
    let fooStr = foo.toString();
    let fooMatchFunc = fooStr.match(/^\s*function\s*\(\s*\)\s*\{(([\s\S](?!\}$))*[\s\S])/);

    console.log(fooStr);
    console.log(fooMatchFunc);

    let funcStream = [fooMatchFunc[1]];
    return window.URL.createObjectURL(
        new Blob(
            funcStream, 
            {
                type: 'text/javascript'
            }
        )
    ); 
}

function BrowserJudge() {
    let document = window.document,
        navigator = window.navigator,
        agent = navigator.userAgent.toLowerCase(),
        //IE8+支持.返回浏览器渲染当前文档所用的模式
        //IE6,IE7:undefined.IE8:8(兼容模式返回7).IE9:9(兼容模式返回7||8)
        //IE10:10(兼容模式7||8||9)
        IEMode = document.documentMode,
        //chorme
        chrome = window.chrome || false,
        System = {
            //user-agent
            agent: agent,
            //是否为IE
            isIE: /msie/.test(agent),
            //Gecko内核
            isGecko: agent.indexOf("gecko") > 0 && agent.indexOf("like gecko") < 0,
            //webkit内核
            isWebkit: agent.indexOf("webkit") > 0,
            //是否为标准模式
            isStrict: document.compatMode === "CSS1Compat",
            //是否支持subtitle
            supportSubTitle: function () {
                return "track" in document.createElement("track");
            },
            //是否支持scoped
            supportScope: function () {
                return "scoped" in document.createElement("style");
            },
            //获取IE的版本号
            ieVersion: function () {
                try {
                    return agent.match(/msie ([\d.]+)/)[1] || 0;
                } catch (e) {
                    console.log("error");
                    return IEMode;
                }
            },
            //Opera版本号
            operaVersion: function () {
                try {
                    if (window.opera) {
                        return agent.match(/opera.([\d.]+)/)[1];
                    } else if (agent.indexOf("opr") > 0) {
                        return agent.match(/opr\/([\d.]+)/)[1];
                    }
                } catch (e) {
                    console.log("error");
                    return 0;
                }
            },
            //描述:version过滤.如31.0.252.152 只保留31.0
            versionFilter: function () {
                if (arguments.length === 1 && typeof arguments[0] === "string") {
                    let version = arguments[0];
                    let start = version.indexOf(".");
                    if (start > 0) {
                        let end = version.indexOf(".", start + 1);
                        if (end !== -1) {
                            return version.substr(0, end);
                        }
                    }
                    return version;
                } else if (arguments.length === 1) {
                    return arguments[0];
                }
                return 0;
            }
        };

    try {
        //浏览器类型(IE、Opera、Chrome、Safari、Firefox)
        System.type = System.isIE ? "IE" :
            window.opera || (agent.indexOf("opr") > 0) ? "Opera" :
                (agent.indexOf("chrome") > 0) ? "Chrome" :
                    //safari也提供了专门的判定方式
                    window.openDatabase ? "Safari" :
                        (agent.indexOf("firefox") > 0) ? "Firefox" :
                            'unknow';

        //版本号
        System.version = (System.type === "IE") ? System.ieVersion() :
            (System.type === "Firefox") ? agent.match(/firefox\/([\d.]+)/)[1] :
                (System.type === "Chrome") ? agent.match(/chrome\/([\d.]+)/)[1] :
                    (System.type === "Opera") ? System.operaVersion() :
                        (System.type === "Safari") ? agent.match(/version\/([\d.]+)/)[1] :
                            "0";

        //浏览器外壳
        System.shell = function () {
            //遨游浏览器
            if (agent.indexOf("maxthon") > 0) {
                System.version = agent.match(/maxthon\/([\d.]+)/)[1] || System.version;
                return "傲游浏览器";
            }
            //QQ浏览器
            if (agent.indexOf("qqbrowser") > 0) {
                System.version = agent.match(/qqbrowser\/([\d.]+)/)[1] || System.version;
                return "QQ浏览器";
            }

            //搜狗浏览器
            if (agent.indexOf("se 2.x") > 0) {
                return '搜狗浏览器';
            }

            //Chrome:也可以使用window.chrome && window.chrome.webstore判断
            if (chrome && System.type !== "Opera") {
                let external = window.external,
                    clientInfo = window.clientInformation,
                    //客户端语言:zh-cn,zh.360下面会返回undefined
                    clientLanguage = clientInfo.languages;

                //猎豹浏览器:或者agent.indexOf("lbbrowser")>0
                if (external && 'LiebaoGetVersion' in external) {
                    return '猎豹浏览器';
                }
                //百度浏览器
                if (agent.indexOf("bidubrowser") > 0) {
                    System.version = agent.match(/bidubrowser\/([\d.]+)/)[1] ||
                        agent.match(/chrome\/([\d.]+)/)[1];
                    return "百度浏览器";
                }
                //360极速浏览器和360安全浏览器
                if (System.supportSubTitle() && typeof clientLanguage === "undefined") {
                    //object.key()返回一个数组.包含可枚举属性和方法名称
                    let storeKeyLen = Object.keys(chrome.webstore).length,
                        v8Locale = "v8Locale" in window;
                    return storeKeyLen > 1 ? '360极速浏览器' : '360安全浏览器';
                }
                return "Chrome";
            }
            return System.type;
        };

        //浏览器名称(如果是壳浏览器,则返回壳名称)
        System.name = System.shell();
        //对版本号进行过滤过处理
        System.version = System.versionFilter(System.version);

    } catch (e) {
        console.log("error", e);
    }
    return [System.type, System.version];
}

module.exports = {
    frameDataAlignCrop : frameDataAlignCrop,
    GetUriFormat : GetUriFormat,
    GetFormatPlayCore : GetFormatPlayCore,
    GetUriProtocol : GetUriProtocol,
    GetMsTime : GetMsTime,
    GetScriptPath : GetScriptPath,
    BrowserJudge : BrowserJudge
}; // module exports
