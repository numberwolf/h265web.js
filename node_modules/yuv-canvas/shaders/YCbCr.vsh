precision lowp float;

attribute vec2 aPosition;
attribute vec2 aLumaPosition;
attribute vec2 aChromaPosition;
varying vec2 vLumaPosition;
varying vec2 vChromaPosition;
void main() {
    gl_Position = vec4(aPosition, 0, 1);
    vLumaPosition = aLumaPosition;
    vChromaPosition = aChromaPosition;
}
