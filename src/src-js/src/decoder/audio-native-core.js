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
const AudioContext 	= window.AudioContext || window.webkitAudioContext;
const def = require('../consts');
const AVCommon = require('./av-common');

// const getMsTime = () => {
//     return new Date().getTime();
// };

class AudioPcmPlayerModule {

	constructor() {

		// this._sample_rate 	= config.sampleRate || 44100;
		// this._seg_dur 		= config.segDur || 2; // 2 second
		// this._channels 		= config.channels || 1;
		this._sample_rate 	= 44100;
		this._seg_dur 		= 0.1; // 2 second
		this._channels 		= 1;

		this._swapStartPlay = true;
		this.playStartTime 	= -1;
		this.playTimestamp 	= 0.0; // @TODO
		this._now_seg_dur 	= -1;
		this._push_start_idx= 0;

		this._playInterval = null;

		// chunk = new Float32Array(u8_byte_arr.buffer);
		this._pcm_array_buf = null;
		this._pcm_array_frame = [];

		this._once_pop_len 	= parseInt(this._sample_rate * this._seg_dur); // ~ 2s 44100

		this._active_node 	= null;

		// Audio Context
		this._ctx 				= new AudioContext();
		this._gain				= this._ctx.createGain();
		this._gain.gain.value 	= 1.0; // volume
		this._gain.connect(this._ctx.destination);
	}

	setVoice(volume) {
		this._gain.gain.value = volume;
	}

	pushBufferFrame(buf, v_pts) {

	} // pushBufferFrame

	/**
	 * @breif 	pack audio fltp(f32le) frames
	 *			keep one first channel
	 * @param 	Uint8Array res_arr_buf
	 * @return
	 */
	pushBuffer(buf) {
		// pcm_array_buf

		// trans to ArrayBuffer
		let res_arr_buf = buf.buffer;

		let chunk = null;
		// padding
		// console.log("audio buf ", res_arr_buf);
		let padding_bytes = res_arr_buf.byteLength % 4;
		if (padding_bytes !== 0) {
        	// console.log("audio ============> padding:", padding_bytes);

        	let u8_byte_arr = new Uint8Array(res_arr_buf.byteLength + padding_bytes);
        	u8_byte_arr.set(new Uint8Array(res_arr_buf), 0);
        	// console.log(u8_byte_arr);
        	chunk = new Float32Array(u8_byte_arr.buffer);

        	// console.log(chunk, chunk.byteLength);
        } else {
        	chunk = new Float32Array(res_arr_buf);
        }

        // console.log("audio chunk len:", chunk);

        /*
         * pack unit pcm
         */
        let oneChannelBuf = null;
        if (this._channels >= 2) {
        	const singleLen = chunk.length / 2;
        	oneChannelBuf = new Float32Array(singleLen);

        	let bufIndex = 0;
	        for (let i = 0; i < chunk.length; i += 2) {
	        	oneChannelBuf[bufIndex] = chunk[i];
	        	bufIndex++;
	        }
	    } else {
	    	oneChannelBuf = new Float32Array(chunk);
	    }

        if (this._pcm_array_buf === null) {
			this._pcm_array_buf = new Float32Array(oneChannelBuf);
		} else {
			let tmp_buf = new Float32Array(this._pcm_array_buf.length + oneChannelBuf.length);
			tmp_buf.set(this._pcm_array_buf, 0);
			tmp_buf.set(oneChannelBuf, this._pcm_array_buf.length);
			this._pcm_array_buf = tmp_buf;
		}

		console.log("decode_audio_g711 -------------------------- audio this._pcm_array_buf len = ", 
			this._pcm_array_buf.length);
	}

	readingLoopWithF32() {
		// if (this.playStartTime > 0 && AVCommon.GetMsTime() - this.playStartTime >= this._now_seg_dur) {
		// 	console.log("AVCommon.GetMsTime() - start_time >= now_seg_dur", 
		// 		AVCommon.GetMsTime(), this.playStartTime, this._now_seg_dur);
		// 	this.playStartTime = -1;
		// 	this._now_seg_dur = -1;
		// }

		// if (this.playStartTime < 0) {
		// 	this.playStartTime = AVCommon.GetMsTime();
		// 	this.playTimestamp = AVCommon.GetMsTime();
		// }

		// console.log(AVCommon.GetMsTime());

		// if (this.playStartTime < 0) {
		// console.log("---------------- loop", new Date());

		if (this._pcm_array_buf !== null && this._pcm_array_buf.length > this._push_start_idx) 
		{
			console.log("===================> readingLoopWithF32 <===================");

			if (this.playStartTime < 0) {
				this.playStartTime = AVCommon.GetMsTime();
				this.playTimestamp = AVCommon.GetMsTime();
			}

			this._swapStartPlay = false;
			// POP出数据
			let end_idx = this._push_start_idx + this._once_pop_len;
			if (end_idx > this._pcm_array_buf.length) {
				end_idx = this._pcm_array_buf.length;
			}
			let data = this._pcm_array_buf.slice(this._push_start_idx, end_idx);
			this._push_start_idx += data.length;
			// let data = pcm_array_buf;

			this._now_seg_dur = (1.0 * data.length / this._sample_rate) * 1000;

			console.log(data.length, this._sample_rate, this._now_seg_dur);

		    const aud_buf = this._ctx.createBuffer(1, data.length, this._sample_rate);
		    console.log("================> PLAY START", data.length, new Date());
		    // copy our fetched data to its first channel
		    aud_buf.copyToChannel(data, 0);
		    // the actual player
		    this._active_node = this._ctx.createBufferSource();
		    this._active_node.buffer = aud_buf;
		    this._active_node.connect(this._gain);

		    this.playStartTime = AVCommon.GetMsTime();
		    this._active_node.start(0);


		    this.playTimestamp += this._now_seg_dur;
		    // console.log("================> PLAY ENDED", data.length, new Date());
		} else {
			// console.log("================> WAIT 1s");
			return -1;
		}

		return 0;

		// } // end if start < 0
	} // readingLoopWithF32

	getAlignVPTS() {
		return this.playTimestamp;
	} // getAlignVPTS

	// @TODO
	/*
	dist-play.js:31907 Uncaught TypeError: t.audioWAudio.pause is not a function
    at dist-play.js:31907:159
    */
	pause() {
		if (this._playInterval !== null) {
			window.clearInterval(this._playInterval);
			this._playInterval = null;
		}
	}

	play() {
		let _this = this;
		// 一切结束后启动定时器
        this._playInterval = window.setInterval(() => {
			let ret_read = _this.readingLoopWithF32();
			// if (ret_read < 0) {
			// 	_this.pause();
			// }
		}, 10);
	}

} // AudioPcmPlayerModule

exports.AudioPcmPlayer = AudioPcmPlayerModule;
