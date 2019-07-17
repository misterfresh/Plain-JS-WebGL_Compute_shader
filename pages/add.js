// ComputeShader source
// language=GLSL
const computeShaderSource = `#version 310 es
    layout (local_size_x = 8, local_size_y = 1, local_size_z = 1) in;
    layout (std430, binding = 0) buffer SSBO {
     float data[];
    } ssbo;
    
    void main() {
      uint threadIndex = gl_GlobalInvocationID.x;
      ssbo.data[threadIndex] = float(threadIndex);
    }
    `;

let context;
let computeProgram;

const script = async () => {
    // Canvas setup
    run()
};

function run(){
    console.log('run')
    getGLContext()
    linkProgram()
    doCompute()
    getResult()
}

function getGLContext() {
    console.log('getting context')
    const canvas = document.createElement(('canvas'));
    canvas.addEventListener("webglcontextlost", function(event) {
        console.log('lost context')
        event.preventDefault();
        run()
    }, false);
    // Create WebGL2ComputeRenderingContext
    context = canvas.getContext('webgl2-compute');
}

function linkProgram() {
    console.log('ctx l', context)
    if (!context) {
        document.body.className = 'error';
        return;
    }
    document.getElementById('context').innerText = 'WebGL2ComputeRenderingContext create: success';

    // create WebGLShader for ComputeShader
    const computeShader = context.createShader(context.COMPUTE_SHADER);
    context.shaderSource(computeShader, computeShaderSource);
    context.compileShader(computeShader);
    if (!context.getShaderParameter(computeShader, context.COMPILE_STATUS)) {
        console.log(context.getShaderInfoLog(computeShader));
        return;
    }

    // create WebGLProgram for ComputeShader
    computeProgram = context.createProgram();
    context.attachShader(computeProgram, computeShader);
    context.linkProgram(computeProgram);
    if (!context.getProgramParameter(computeProgram, context.LINK_STATUS)) {
        console.log(context.getProgramInfoLog(computeProgram));
        return;
    }
}

function doCompute(){
    // input data
    console.log('ctx c', context)
    const input = new Float32Array(8);
    document.getElementById('input').innerText = `input: [${input}]`;

    // create ShaderStorageBuffer
    const ssbo = context.createBuffer();
    context.bindBuffer(context.SHADER_STORAGE_BUFFER, ssbo);
    context.bufferData(context.SHADER_STORAGE_BUFFER, input, context.DYNAMIC_COPY);
    context.bindBufferBase(context.SHADER_STORAGE_BUFFER, 0, ssbo);

    // execute ComputeShader
    context.useProgram(computeProgram);
    context.dispatchCompute(1, 1, 1);
}

function getResult(){
    // get result
    console.log('ctx r', context)
    const result = new Float32Array(8);
    context.getBufferSubData(context.SHADER_STORAGE_BUFFER, 0, result);
    document.getElementById('output').innerText = `output: [${result}]`;
}

window.addEventListener('DOMContentLoaded', script);
