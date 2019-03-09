// ComputeShader source
// language=GLSL
export default function computeShader2(MAX_THREAD_NUM) {
    return `#version 310 es
    layout (local_size_x = ${MAX_THREAD_NUM}, local_size_y = 1, local_size_z = 1) in;
    layout (std430, binding = 0) buffer SSBO {
      float data[];
    } ssbo;
    uniform uvec4 numElements;
    
    void main() {
       float tmp;
      uint ixj = gl_GlobalInvocationID.x ^ numElements.y;
      if (ixj > gl_GlobalInvocationID.x)
      {
        if ((gl_GlobalInvocationID.x & numElements.x) == 0u)
        {
          if (ssbo.data[gl_GlobalInvocationID.x] > ssbo.data[ixj])
          {
            tmp = ssbo.data[gl_GlobalInvocationID.x];
            ssbo.data[gl_GlobalInvocationID.x] = ssbo.data[ixj];
            ssbo.data[ixj] = tmp;
          }
        }
        else
        {
          if (ssbo.data[gl_GlobalInvocationID.x] < ssbo.data[ixj])
          {
            tmp = ssbo.data[gl_GlobalInvocationID.x];
            ssbo.data[gl_GlobalInvocationID.x] = ssbo.data[ixj];
            ssbo.data[ixj] = tmp;
          }
        }
      }
    }
    `
}
