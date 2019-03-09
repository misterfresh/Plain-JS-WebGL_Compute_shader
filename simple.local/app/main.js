import computeShaderSource from '/shaders/compute_shader_glsl.js'

export class Main {
    constructor() {
        console.log(new Date());
        this.init();
    }

    async init() {
        // Canvas setup
        const canvas = document.createElement(('canvas'));

        // Create WebGL2ComputeRenderingContext
        const context = canvas.getContext('webgl2-compute');
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
        }

        // create WebGLProgram for ComputeShader
        const computeProgram = context.createProgram();
        context.attachShader(computeProgram, computeShader);
        context.linkProgram(computeProgram);
        if (!context.getProgramParameter(computeProgram, context.LINK_STATUS)) {
            console.log(context.getProgramInfoLog(computeProgram));
        }

        // input data
        const input = new Float32Array(8);
        document.getElementById('input').innerText = `input: [${input}]`;

        // create ShaderStorageBuffer
        const ssbo = context.createBuffer();
        context.bindBuffer(context.SHADER_STORAGE_BUFFER, ssbo);
        context.bufferData(context.SHADER_STORAGE_BUFFER, input, context.STATIC_DRAW);
        context.bindBufferBase(context.SHADER_STORAGE_BUFFER, 0, ssbo);

        // execute ComputeShader
        context.useProgram(computeProgram);
        context.dispatchCompute(1, 1, 1);

        // get result
        const result = new Float32Array(8);
        context.getBufferSubData(context.SHADER_STORAGE_BUFFER, 0, result);
        document.getElementById('output').innerText = `output: [${result}]`;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Main();
});
