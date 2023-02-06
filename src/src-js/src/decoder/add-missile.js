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
if (d.cmd === "goexit") {
                            const e_data = e.data.data;
                            if (e_data !== undefined && e_data !== null) {
                                // console.log("ecmd go thread 1", e_data, e_data.corePtr);
                                if (e_data.corePtr !== undefined && e_data.corePtr !== null) 
                                {
                                    // console.log("ecmd go thread 2", e_data);
                                    const corePtr = e_data.corePtr;
                                    window.g_players[corePtr]._avSetRecvFinished();
                                }
                            }
                        } else if (d.cmd === "go") {
                            // console.log("ecmd go thread ", window);
                            // window.postMessage(e.data);
                            /*
                            {
                                cmd: 'go', 
                                data: {
                                    corePtr: $0,
                                    naluFrame: $1,
                                    frameLen: $2,
                                    isKey: $3,
                                    width: $4,
                                    height: $5,
                                    v_pts: $6,
                                    v_dts: $7,
                                    isRaw: $8
                                }
                            }
                             */
                            const e_data = e.data.data;
                            if (e_data !== undefined && e_data !== null) {
                                // console.log("ecmd go thread 1", e_data, e_data.corePtr);
                                if (e_data.corePtr !== undefined && 
                                    e_data.corePtr !== null &&
                                    window.g_players !== undefined && 
                                    window.g_players !== null &&
                                    window.g_players[e_data.corePtr] !== undefined &&
                                    window.g_players[e_data.corePtr] !== null) 
                                {
                                    // console.log("ecmd go thread 2", e_data);
                                    const corePtr = e_data.corePtr;
                                    const coreType = e_data.type;
                                    if (coreType === "video") { // @TODO
                                        window.g_players[corePtr]._naluCallback(
                                            e_data.naluFrame,
                                            e_data.frameLen,
                                            e_data.isKey,
                                            e_data.width,
                                            e_data.height,
                                            e_data.v_pts,
                                            e_data.v_dts,
                                            e_data.isRaw);
                                    } else if (coreType === "audio") { // @TODO
                                        /*
                                         {
                                                    cmd:"go",
                                                    data: {
                                                            type: "audio",
                                                            corePtr: $0,
                                                            adts: $1,
                                                            data: $2,
                                                            size: $3,
                                                            channels: $4,
                                                            v_pts: $5
                                                    }
                                            }
                                        */
                                        window.g_players[corePtr]._aacFrameCallback(
                                            e_data.adts, 
                                            e_data.data, 
                                            e_data.size, 
                                            e_data.channels, 
                                            e_data.v_pts);
                                    } else if (coreType === "decode_video") {
                                        // type: "decode_video",
                                        // corePtr: $0,
                                        // y: $1,
                                        // u: $2,
                                        // v: $3,
                                        // line1: $4,
                                        // line2: $5,
                                        // line3: $6,
                                        // w: $7,
                                        // h: $8,
                                        // v_pts: $9,
                                        // tag: $10
                                        let ret1 = window.g_players[corePtr]._frameCallback(
                                                e_data.y, 
                                                e_data.u, 
                                                e_data.v,
                                                e_data.line1, 
                                                e_data.line2, 
                                                e_data.line3,
                                                e_data.w, 
                                                e_data.h, 
                                                e_data.v_pts, 
                                                e_data.tag);
                                        // console.log(
                                        //  "ecmd go thread decode_video", 
                                        //  e_data.v_pts, ret1, window.g_players[corePtr]._videoQueue);
                                    } else if (coreType === "decode_video_flv") {
                                        let ret1 = window.g_players[corePtr]._callbackYUV(
                                                e_data.y, 
                                                e_data.u, 
                                                e_data.v,
                                                e_data.line1, 
                                                e_data.line2, 
                                                e_data.line3,
                                                e_data.w, 
                                                e_data.h, 
                                                e_data.v_pts, 
                                                e_data.tag);
                                    } else if (coreType === "decode_video_g711") {
                                        let ret1 = window.g_players[corePtr]._callbackYUV(
                                                e_data.y, 
                                                e_data.u, 
                                                e_data.v,
                                                e_data.line1, 
                                                e_data.line2, 
                                                e_data.line3,
                                                e_data.w, 
                                                e_data.h, 
                                                e_data.v_pts, 
                                                e_data.tag);
                                    } else if (coreType === "decode_audio_g711") {
                                        // type: "decode_audio_g711",
                                        //                     corePtr: $0,
                                        //                     pcm: $1,
                                        //                     len: $2,
                                        //                     v_pts: $3,
                                        //                     tag: $4
                                        // console.log("decode_audio_g711", e_data);
                                        let ret1 = window.g_players[corePtr]._callbackPCM(
                                                e_data.pcm, 
                                                e_data.len, 
                                                e_data.v_pts,
                                                e_data.tag);
                                    } // end if coreType
                                } // end if check corePtr exist
                            } // if (e_data !== undefined && e_data !== null)
                        } else {
                            err("worker sent an unknown command " + d.cmd)
                        }