// ComputeShader source
// language=GLSL
export default function computeShader1(MAX_THREAD_NUM) {
    return `#version 310 es
    layout (local_size_x = ${MAX_THREAD_NUM}, local_size_y = 1, local_size_z = 1) in;
    layout (std430, binding = 0) buffer SSBO {
      float data[];
    } ssbo;
    shared float sharedData[${MAX_THREAD_NUM}];
    
    void main() {
      sharedData[gl_LocalInvocationID.x] = ssbo.data[gl_GlobalInvocationID.x];
      memoryBarrierShared();
      barrier();
      
      uint offset = gl_WorkGroupID.x * gl_WorkGroupSize.x;
      
      float tmp;
      for (uint k = 2u; k <= gl_WorkGroupSize.x; k <<= 1) {
        for (uint j = k >> 1; j > 0u; j >>= 1) {
          uint ixj = (gl_GlobalInvocationID.x ^ j) - offset;
          if (ixj > gl_LocalInvocationID.x) {
            if ((gl_GlobalInvocationID.x & k) == 0u) {
              if (sharedData[gl_LocalInvocationID.x] > sharedData[ixj]) {
                tmp = sharedData[gl_LocalInvocationID.x];
                sharedData[gl_LocalInvocationID.x] = sharedData[ixj];
                sharedData[ixj] = tmp;
              }
            }
            else
            {
              if (sharedData[gl_LocalInvocationID.x] < sharedData[ixj]) {
                tmp = sharedData[gl_LocalInvocationID.x];
                sharedData[gl_LocalInvocationID.x] = sharedData[ixj];
                sharedData[ixj] = tmp;
              }
            }
          }
          memoryBarrierShared();
          barrier();
        }
      }
      ssbo.data[gl_GlobalInvocationID.x] = sharedData[gl_LocalInvocationID.x];
    }
    `
}
