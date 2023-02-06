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
    HEVC_NAL_TRAIL_N    : 0,
    HEVC_NAL_TRAIL_R    : 1,
    HEVC_NAL_TSA_N      : 2,
    HEVC_NAL_TSA_R      : 3,
    HEVC_NAL_STSA_N     : 4,
    HEVC_NAL_STSA_R     : 5,
    HEVC_NAL_RADL_N     : 6,
    HEVC_NAL_RADL_R     : 7,
    HEVC_NAL_RASL_N     : 8,
    HEVC_NAL_RASL_R     : 9,
    HEVC_NAL_VCL_N10    : 10,
    HEVC_NAL_VCL_R11    : 11,
    HEVC_NAL_VCL_N12    : 12,
    HEVC_NAL_VCL_R13    : 13,
    HEVC_NAL_VCL_N14    : 14,
    HEVC_NAL_VCL_R15    : 15,
    HEVC_NAL_BLA_W_LP   : 16,
    HEVC_NAL_BLA_W_RADL : 17,
    HEVC_NAL_BLA_N_LP   : 18,
    HEVC_NAL_IDR_W_RADL : 19,
    HEVC_NAL_IDR_N_LP   : 20,
    HEVC_NAL_CRA_NUT    : 21,
    HEVC_NAL_IRAP_VCL22 : 22,
    HEVC_NAL_IRAP_VCL23 : 23,
    HEVC_NAL_RSV_VCL24  : 24,
    HEVC_NAL_RSV_VCL25  : 25,
    HEVC_NAL_RSV_VCL26  : 26,
    HEVC_NAL_RSV_VCL27  : 27,
    HEVC_NAL_RSV_VCL28  : 28,
    HEVC_NAL_RSV_VCL29  : 29,
    HEVC_NAL_RSV_VCL30  : 30,
    HEVC_NAL_RSV_VCL31  : 31,
    HEVC_NAL_VPS        : 32,
    HEVC_NAL_SPS        : 33,
    HEVC_NAL_PPS        : 34,
    HEVC_NAL_AUD        : 35,
    HEVC_NAL_EOS_NUT    : 36,
    HEVC_NAL_EOB_NUT    : 37,
    HEVC_NAL_FD_NUT     : 38,
    HEVC_NAL_SEI_PREFIX : 39,
    HEVC_NAL_SEI_SUFFIX : 40,
    HEVC_NAL_RSV_NVCL41 : 41,
    HEVC_NAL_RSV_NVCL42 : 42,
    HEVC_NAL_RSV_NVCL43 : 43,
    HEVC_NAL_RSV_NVCL44 : 44,
    HEVC_NAL_RSV_NVCL45 : 45,
    HEVC_NAL_RSV_NVCL46 : 46,
    HEVC_NAL_RSV_NVCL47 : 47,
    HEVC_NAL_UNSPEC48   : 48,
    HEVC_NAL_UNSPEC49   : 49,
    HEVC_NAL_UNSPEC50   : 50,
    HEVC_NAL_UNSPEC51   : 51,
    HEVC_NAL_UNSPEC52   : 52,
    HEVC_NAL_UNSPEC53   : 53,
    HEVC_NAL_UNSPEC54   : 54,
    HEVC_NAL_UNSPEC55   : 55,
    HEVC_NAL_UNSPEC56   : 56,
    HEVC_NAL_UNSPEC57   : 57,
    HEVC_NAL_UNSPEC58   : 58,
    HEVC_NAL_UNSPEC59   : 59,
    HEVC_NAL_UNSPEC60   : 60,
    HEVC_NAL_UNSPEC61   : 61,
    HEVC_NAL_UNSPEC62   : 62,
    HEVC_NAL_UNSPEC63   : 63,
    // (charByte & 0x7E) >> 1 之前
    SOURCE_CODE_VPS     : 0x40, // 64
    SOURCE_CODE_SPS     : 0x42,
    SOURCE_CODE_PPS     : 0x44,
    SOURCE_CODE_SEI     : 0x4e,
    SOURCE_CODE_IDR     : 0x26,
    SOURCE_CODE_P       : 0x02,
    SOURCE_CODE_SEI_END : 0x80,
    // (charByte & 0x7E) >> 1 结果
    // TYPE_CODE_VPS       : 32, // 64
    // TYPE_CODE_SPS       : 33,
    // TYPE_CODE_PPS       : 34,
    // TYPE_CODE_SEI       : 39,
    // TYPE_CODE_IDR       : 19,
    // TYPE_CODE_P         : 1,
    // 自定义
    DEFINE_STARTCODE    : new Uint8Array([0, 0, 0, 1]),
    DEFINE_KEY_FRAME    : 0x15, // I tag
    DEFINE_P_FRAME      : 0x09, // P tag
    DEFINE_OTHERS_FRAME : 0x99
}
