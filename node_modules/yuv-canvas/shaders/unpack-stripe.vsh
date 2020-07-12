precision lowp float;

attribute vec2 aPosition;
attribute vec2 aTexturePosition;
varying vec2 vTexturePosition;

void main() {
    gl_Position = vec4(aPosition, 0, 1);
    vTexturePosition = aTexturePosition;
}
