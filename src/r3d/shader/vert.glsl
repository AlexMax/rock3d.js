uniform mat4 uView;
uniform mat4 uProjection;

attribute vec3 lPos;
attribute vec4 lAtlasInfo;
attribute vec2 lTexCoord;

varying vec4 fAtlasInfo;
varying vec2 fTexCoord;

void main() {
    fAtlasInfo = lAtlasInfo;

    gl_Position = uProjection * uView * vec4(lPos, 1.0);

    float uAtOrigin = lAtlasInfo.x;
    float vAtOrigin = lAtlasInfo.y;
    float uAtLen = lAtlasInfo.z;
    float vAtLen = lAtlasInfo.w;

    fTexCoord.x = (lTexCoord.x * uAtLen) + uAtOrigin;
    fTexCoord.y = (lTexCoord.y * vAtLen) + vAtOrigin;
}
