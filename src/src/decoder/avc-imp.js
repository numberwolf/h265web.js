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
	/*
	 static bool isH264iFrame(byte[] paket)
	    {
	        int RTPHeaderBytes = 0;
	 
	        int nal_type = paket[RTPHeaderBytes + 1] & 0x1F; 
	        if (nal_type == 5 || nal_type == 7 || nal_type == 8|| nal_type == 2)
	        {
	            return true;
	        }
	 
	        return false;
	   }
   */
	NALU_IS_KEYFRAME: (charByte) => {
        let nal_type = charByte & 31;
        console.log(nal_type);
        if (nal_type === 5 
        	|| nal_type == 7 
	        || nal_type == 8 
	        || nal_type == 2) {
            return true;
        }
        return false;
    }
};
