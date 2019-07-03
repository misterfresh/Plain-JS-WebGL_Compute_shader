// VertexShader source
// language=GLSL
export default `#version 310 es
    layout (location = 0) in vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
      gl_PointSize = 3.0;
    }
    `;
