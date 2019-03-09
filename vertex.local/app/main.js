import Stats from '/stats.js';

import computeShaderSource from '/shaders/compute_shader_glsl.js'
import vertexShaderSource from '/shaders/vertex_shader_glsl.js'
import fragmentShaderSource from '/shaders/fragment_shader_glsl.js'

export class Main
{
    CANVAS_WIDTH = 512;
    CANVAS_HEIGHT = 512;

    NUM_PARTICLES = 8;

    stats;

    context;
    computeProgram;
    renderProgram;
    ssbo;
    timeUniformLocation;

    time;

    constructor()
    {
        console.log(new Date());
        this.init();
    }

    async init()
{
    // Canvas setup
    const canvas = document.getElementById(('myCanvas'));
    canvas.width = Main.CANVAS_WIDTH;
    canvas.height = Main.CANVAS_HEIGHT;

    // Create WebGL2ComputeRenderingContext
    const context = canvas.getContext('webgl2-compute');
    if(!context)
    {
        document.body.className = 'error';
        return;
    }
    this.context = context;

    // Stats setup
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);

    // create WebGLShader for ComputeShader
    const computeShader = context.createShader(context.COMPUTE_SHADER);
    context.shaderSource(computeShader, computeShaderSource);
    context.compileShader(computeShader);
    if(!context.getShaderParameter(computeShader, context.COMPILE_STATUS))
    {
        console.log(context.getShaderInfoLog(computeShader));
    }

    // create WebGLProgram for ComputeShader
    const computeProgram = context.createProgram();
    context.attachShader(computeProgram, computeShader);
    context.linkProgram(computeProgram);
    if(!context.getProgramParameter(computeProgram, context.LINK_STATUS))
    {
        console.log(context.getProgramInfoLog(computeProgram));
    }
    this.computeProgram = computeProgram;

    // get uniform location in ComputeShader
    this.timeUniformLocation = context.getUniformLocation(computeProgram, 'time');

    // create ShaderStorageBuffer
    const ssbo = context.createBuffer();
    context.bindBuffer(context.SHADER_STORAGE_BUFFER, ssbo);
    this.context.bufferData(this.context.SHADER_STORAGE_BUFFER, new Float32Array(Main.NUM_PARTICLES * 2), this.context.STATIC_DRAW);
    this.context.bindBufferBase(this.context.SHADER_STORAGE_BUFFER, 0, ssbo);
    this.ssbo = ssbo;

    // create WebGLShader for VertexShader
    const vertexShader = this.context.createShader(this.context.VERTEX_SHADER);
    this.context.shaderSource(vertexShader, vertexShaderSource);
    this.context.compileShader(vertexShader);
    if(!this.context.getShaderParameter(vertexShader, this.context.COMPILE_STATUS))
    {
        console.log(this.context.getShaderInfoLog(vertexShader));
    }

    // create WebGLShader for FragmentShader
    const fragmentShader = this.context.createShader(this.context.FRAGMENT_SHADER);
    this.context.shaderSource(fragmentShader, fragmentShaderSource);
    this.context.compileShader(fragmentShader);
    if(!this.context.getShaderParameter(fragmentShader, this.context.COMPILE_STATUS))
    {
        console.log(this.context.getShaderInfoLog(fragmentShader));
    }

    // create WebGLProgram for rendering
    const renderProgram = this.context.createProgram();
    this.context.attachShader(renderProgram, vertexShader);
    this.context.attachShader(renderProgram, fragmentShader);
    this.context.linkProgram(renderProgram);
    if(!this.context.getProgramParameter(renderProgram, this.context.LINK_STATUS))
    {
        console.log(this.context.getProgramInfoLog(renderProgram));
    }
    this.renderProgram = renderProgram;

    // bind ShaderStorageBuffer as ARRAY_BUFFER
    this.context.bindBuffer(this.context.ARRAY_BUFFER, ssbo);
    this.context.enableVertexAttribArray(0);
    this.context.vertexAttribPointer(0, 2, this.context.FLOAT, false, 0, 0);

    // initialize states
    context.clearColor(0.2, 0.2, 0.2, 1.0);
    this.time = 0.0;

    this.render();
}

    render()
    {
        this.stats.begin();

        this.time += 1.0;

        // execute ComputeShader
        this.context.useProgram(this.computeProgram);
        this.context.uniform1f(this.timeUniformLocation, this.time);
        this.context.dispatchCompute(1, 1, 1);
        this.context.memoryBarrier(this.context.VERTEX_ATTRIB_ARRAY_BARRIER_BIT);

        // render
        this.context.clear(this.context.COLOR_BUFFER_BIT);
        this.context.useProgram(this.renderProgram);
        this.context.drawArrays(this.context.POINTS, 0, Main.NUM_PARTICLES);

        this.stats.end();

        requestAnimationFrame(() => this.render());
    }
}

Main.CANVAS_WIDTH = 512;
Main.CANVAS_HEIGHT = 512;
Main.NUM_PARTICLES = 8;

window.addEventListener('DOMContentLoaded', () =>
{
    new Main();
});

