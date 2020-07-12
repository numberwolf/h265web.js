// extra 'stripe' texture fiddling to work around IE 11's poor performance on gl.LUMINANCE and gl.ALPHA textures

precision lowp float;

uniform sampler2D uStripe;
uniform sampler2D uTexture;
varying vec2 vTexturePosition;
void main() {
   // Y, Cb, and Cr planes are mapped into a pseudo-RGBA texture
   // so we can upload them without expanding the bytes on IE 11
   // which doesn't allow LUMINANCE or ALPHA textures
   // The stripe textures mark which channel to keep for each pixel.
   // Each texture extraction will contain the relevant value in one
   // channel only.

   float fLuminance = dot(
      texture2D(uStripe, vTexturePosition),
      texture2D(uTexture, vTexturePosition)
   );

   gl_FragColor = vec4(fLuminance, fLuminance, fLuminance, 1);
}
