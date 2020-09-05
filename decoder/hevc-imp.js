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
    },
    /**
     * layer :
     *          nalu layer
     *              vps sps pps sei
     *          vlc  layer
     *              vlc data
     */
    PACK_NALU           : (layer) => {
        let naluLayer   = layer.nalu;
        let vlcLayer    = layer.vlc;
        let vlc         = vlcLayer.vlc;

        let pktFrame    = new Uint8Array(
                naluLayer.vps.length 
                + naluLayer.sps.length 
                + naluLayer.pps.length 
                + naluLayer.sei.length 
                + vlc.length
        );

        pktFrame.set(naluLayer.vps, 0);

        pktFrame.set(naluLayer.sps, 
            naluLayer.vps.length);

        pktFrame.set(naluLayer.pps, 
            naluLayer.vps.length + naluLayer.sps.length);

        pktFrame.set(naluLayer.sei, 
            naluLayer.vps.length + naluLayer.sps.length + naluLayer.pps.length);

        pktFrame.set(vlc, 
            naluLayer.vps.length + naluLayer.sps.length + naluLayer.pps.length + naluLayer.sei.length);

        return pktFrame;
    }
};