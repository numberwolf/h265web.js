const HevHeader = require('./hevc-header');
let DEFINE_HEV_PS = [
    HevHeader.HEVC_NAL_VPS, 
    HevHeader.HEVC_NAL_SPS, 
    HevHeader.HEVC_NAL_PPS, 
    HevHeader.HEVC_NAL_SEI_PREFIX
]
module.exports = {
    IS_HEV_PS_INFO_CHAR : (charByte) => {
        let type = (charByte & 0x7E) >> 1;
        return DEFINE_HEV_PS.indexOf(type);
    },
    GET_NALU_TYPE       : (charByte) => {
        let type = (charByte & 0x7E) >> 1;
        if (type >= 1 && type <= 9) {
            return HevHeader.DEFINE_P_FRAME;
        } else if (type >= 16 && type <= 21) {
            return HevHeader.DEFINE_KEY_FRAME;
        } else {
            let typeInfo = DEFINE_HEV_PS.indexOf(type);
            if (typeInfo > 0) {
                return typeInfo;
            } else {
                return HevHeader.DEFINE_OTHERS_FRAME;
            }
        }
    }
};