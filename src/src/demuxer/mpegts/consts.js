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
module.exports = {
    DEFAULT_SAMPLERATE: 44100,
    DEFAULT_CHANNEL: 1,
    H264AUD : [0, 0, 0, 1, 0x09, 0xE0],
    H265AUD : [0, 0, 0, 1, 0x46, 0x01, 0x50],  // new Uint8Array(
    DEF_AAC : "aac",
    DEF_MP3 : "mp3",
    DEF_H265 : "h265",
    DEF_HEVC : "hevc",
    DEF_H264 : "h264",
    DEF_AVC : "avc",
    CODEC_OFFSET_TABLE : [	
	    "hevc", "h265",
	    "avc", "h264",
	    "aac", "mp3"
    ]
}
