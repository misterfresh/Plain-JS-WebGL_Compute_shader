import computeShader1 from './bitonic_compute_shader_1_glsl.js'
import computeShader2 from './bitonic_compute_shader_2_glsl.js'

export class Main {
    MAX_THREAD_NUM = 1024;
    MAX_GROUP_NUM = 2048;

    logElement;
    selectBox;

    context;
    bitonicSortProgram1;
    bitonicSortProgram2;
    bitonicSortProgram2UniformLocation;

    constructor() {
        console.log(new Date());
        this.init();
    }

    async init() {
        // Selector setup
        this.selectBox = document.getElementById('selectBox');
        const maxNumElementsIndex = Math.log2(Main.MAX_THREAD_NUM * Main.MAX_GROUP_NUM) - 9;
        for (let i = 0; i < maxNumElementsIndex; i++) {
            const option = document.createElement('option');
            option.text = '' + this.getLength(i);
            this.selectBox.add(option);
        }
        this.selectBox.selectedIndex = 7;
        this.selectBox.addEventListener('change', () => {
            this.logElement.innerText = '';
            this.selectBox.disabled = true;
            requestAnimationFrame(() => this.compute());
        });

        // Div setup
        this.logElement = document.getElementById('log');

        // Canvas setup
        const canvas = document.createElement(('canvas'));

        // Create WebGL2ComputeRenderingContext
        const context = canvas.getContext('webgl2-compute');
        if (!context) {
            document.body.className = 'error';
            return;
        }
        this.context = context;

        this.initializeComputeProgram();

        this.compute();
    }

    async compute() {
        const length = this.getLength(this.selectBox.selectedIndex);
        const arr = new Float32Array(length);
        this.resetData(arr, length);

        await this.computeCPU(arr.slice(0));
        await this.computeGPU(arr.slice(0));

        this.selectBox.disabled = false;
    }

    async computeCPU(arr) {
        const now = performance.now();
        arr.sort(
            (a, b) => {
                return a - b;
            }
        );
        this.log(`CPU sort time: ${Math.round(performance.now() - now)} ms`);
        console.log(`sort result validation: ${this.validateSorted(arr) ? 'success' : 'failure'}`);

        // console.log(arr);
    }

    async computeGPU(arr) {
        const now = performance.now();

        const context = this.context;

        const length = arr.length;

        const threadgroupsPerGrid = Math.max(1, length / Main.MAX_THREAD_NUM);

        // create ShaderStorageBuffer
        const ssbo = context.createBuffer();
        context.bindBuffer(context.SHADER_STORAGE_BUFFER, ssbo);
        context.bufferData(context.SHADER_STORAGE_BUFFER, arr, context.STATIC_DRAW);
        context.bindBufferBase(context.SHADER_STORAGE_BUFFER, 0, ssbo);

        // execute ComputeShader
        context.useProgram(this.bitonicSortProgram1);
        context.dispatchCompute(threadgroupsPerGrid, 1, 1);
        context.memoryBarrier(context.SHADER_STORAGE_BARRIER_BIT);

        if (threadgroupsPerGrid > 1) {
            for (let k = threadgroupsPerGrid; k <= length; k <<= 1) {
                for (let j = k >> 1; j > 0; j >>= 1) {
                    // execute ComputeShader
                    context.useProgram(this.bitonicSortProgram2);
                    context.uniform4uiv(this.bitonicSortProgram2UniformLocation, new Uint32Array([k, j, 0, 0]));
                    context.dispatchCompute(threadgroupsPerGrid, 1, 1);
                    context.memoryBarrier(context.SHADER_STORAGE_BARRIER_BIT);
                }
            }
        }

        // get result
        const result = new Float32Array(length);
        context.getBufferSubData(context.SHADER_STORAGE_BUFFER, 0, result);
        this.log(`GPU sort time: ${Math.round(performance.now() - now)} ms`);
        console.log(`sort result validation: ${this.validateSorted(result) ? 'success' : 'failure'}`);
    }

    resetData(arr, sortLength) {
        for (let i = 0; i < sortLength; i++) {
            arr[i] = Math.random();
        }
    }

    validateSorted(arr) {
        const length = arr.length;
        for (let i = 0; i < length; i++) {
            if (i !== length - 1 && arr[i] > arr[i + 1]) {
                console.log('validation error:', i, arr[i], arr[i + 1]);
                console.log(arr);
                return false;
            }
        }
        return true;
    }

    initializeComputeProgram() {
        // ComputeShader source
        // language=GLSL
        const computeShaderSource1 = computeShader1(Main.MAX_THREAD_NUM);

        // create WebGLProgram for ComputeShader
        this.bitonicSortProgram1 = this.createComputeProgram(computeShaderSource1);

        // language=GLSL
        const computeShaderSource2 = computeShader2(Main.MAX_THREAD_NUM);

        // create WebGLProgram for ComputeShader
        this.bitonicSortProgram2 = this.createComputeProgram(computeShaderSource2);
        this.bitonicSortProgram2UniformLocation = this.context.getUniformLocation(this.bitonicSortProgram2, 'numElements');
    }

    createComputeProgram(source) {
        const context = this.context;

        // create WebGLShader for ComputeShader
        const computeShader = context.createShader(context.COMPUTE_SHADER);
        context.shaderSource(computeShader, source);
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

        return computeProgram;
    }

    getLength(index) {
        return 1 << (index + 10);
    }

    log(str) {
        this.logElement.innerText += str + '\n';
    }
}

Main.MAX_THREAD_NUM = 1024;
Main.MAX_GROUP_NUM = 2048;

window.addEventListener('DOMContentLoaded', () => {
    new Main();
});
