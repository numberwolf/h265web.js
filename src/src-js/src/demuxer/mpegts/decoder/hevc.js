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

class HevcClazz {
	/**
	 * @brief UInt8array
	 */
	constructor(frame) {
		this.frame = frame;
	}

	_removeAud() {
		// def.H265AUD
		if ([
				this.frame[0], this.frame[0], this.frame[0], this.frame[0], 
				this.frame[0], this.frame[0], this.frame[0]
			] == def.H265AUD
		) {

			let frameTemp = new Uint8Array(this.frame.length - 7);
            frameTemp.set(this.frame.subarray(7));
            this.frame = frameTemp;
		}
	}

	_getKeyType() {
		
	}

	handleFrame() {
		this._removeAud();
		return this.frame;
	}
}

exports.Hevc = HevcClazz;
