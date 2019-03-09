import {GUI} from '/dat.gui.js';
import {vec3, vec4} from '/gl-matrix.js';
import Stats from '/stats.js';
import {ComputeShaderProgramUniform} from './project/ComputeShaderProgramUniform.js';
import {GLTF} from './project/GLTF.js';
import {GUIPanel} from './project/GUIPanel.js';
import {LightingShaderProgram} from './project/LightingShaderProgram.js';
import {LightingShaderProgramUniform} from './project/LightingShaderProgramUniform.js';
import {RGB} from './project/RGB.js';
import {Camera} from './webgl/Camera.js';
import {ProgramObject} from './webgl/ProgramObject.js';
import {RoundCameraController} from './webgl/RoundCameraController.js';
import {SceneObject} from './webgl/SceneObject.js';

import getComputeShader from '/shaders/compute_shader_glsl.js'

class Main
{
    RAD = Math.PI / 180;

    CANVAS_WIDTH = 512;
    CANVAS_HEIGHT = 512;

    COLOR_AMBIENT_LIGHT = vec4.fromValues(0.2, 0.2, 0.2, 1.0);
    COLOR_DIRECTIONAL_LIGHT = vec4.fromValues(0.8, 0.8, 0.8, 1.0);

    WORK_GROUP_SIZE = 256;
    MAX_INSTANCE_NUM = 1024 * 4;

    stats;

    canvas;
    context;
    computeProgram;
    computeUniform;
    computeUniformDirty;
    ssboIn;
    ssboOut;

    camera;
    cameraController;
    renderProgram;
    model;
    numGroups;
    numInstances;

    constructor()
    {
        console.log(new Date());
        this.init();
    }

    async init()
    {
        // Canvas setup
        const canvas =  document.getElementById(('myCanvas'));
        canvas.width = Main.CANVAS_WIDTH;
        canvas.height = Main.CANVAS_HEIGHT;
        this.canvas = canvas;

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

        context.clearColor(0.2, 0.2, 0.2, 1.0);
        context.clearDepth(1.0);
        context.enable(this.context.CULL_FACE);
        context.enable(this.context.DEPTH_TEST);
        context.depthFunc(this.context.LEQUAL);

        this.numInstances = 1024;
        this.numGroups = this.numInstances / Main.WORK_GROUP_SIZE;

        // GUI setup
        const gui = new GUI({autoPlace:true});
        const instanceFolder = gui.addFolder('Instance');
        instanceFolder.open();
        const panel = new GUIPanel();
        panel.num = this.numInstances;
        const numSlider = instanceFolder.add(panel, 'num', Main.WORK_GROUP_SIZE, Main.MAX_INSTANCE_NUM).step(Main.WORK_GROUP_SIZE);
        GUIPanel.setGUITitle(gui, 'num', 'Num');
        numSlider.onFinishChange((value) =>
        {
            this.numInstances = value;
            this.numGroups = this.numInstances / Main.WORK_GROUP_SIZE;
        });

        const separateWeightSlider = instanceFolder.add(panel, 'separateWeight', 0.0, 10.0).step(1.0);
        GUIPanel.setGUITitle(gui, 'separateWeight', 'SeparateWeight');
        separateWeightSlider.onFinishChange((value) =>
        {
            this.computeUniformDirty = true;
            this.computeUniform.separateWeight = value;
        });
        const alignmentWeightSlider = instanceFolder.add(panel, 'alignmentWeight', 0.0, 10.0).step(1.0);
        GUIPanel.setGUITitle(gui, 'alignmentWeight', 'AlignmentWeight');
        alignmentWeightSlider.onFinishChange((value) =>
        {
            this.computeUniformDirty = true;
            this.computeUniform.alignmentWeight = value;
        });
        const cohesionWeightSlider = instanceFolder.add(panel, 'cohesionWeight', 0.0, 10.0).step(1.0);
        GUIPanel.setGUITitle(gui, 'cohesionWeight', 'CohesionWeight');
        cohesionWeightSlider.onFinishChange((value) =>
        {
            this.computeUniformDirty = true;
            this.computeUniform.cohesionWeight = value;
        });
        panel.resetFunction = () =>
        {
            this.computeUniformDirty = true;
            panel.reset();
            separateWeightSlider.updateDisplay();
            alignmentWeightSlider.updateDisplay();
            cohesionWeightSlider.updateDisplay();
            this.computeUniform.separateWeight = panel.separateWeight;
            this.computeUniform.alignmentWeight = panel.alignmentWeight;
            this.computeUniform.cohesionWeight = panel.cohesionWeight;
        };
        instanceFolder.add(panel, 'resetFunction');
        const computeShaderSource = getComputeShader( Main.WORK_GROUP_SIZE)

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

        this.computeUniform = new ComputeShaderProgramUniform('Uniforms', 2);
        this.computeUniform.createBuffer(this.context);
        this.computeUniform.index = this.context.getUniformBlockIndex(this.computeProgram, this.computeUniform.name);
        this.computeUniform.separateWeight = panel.separateWeight;
        this.computeUniform.alignmentWeight = panel.alignmentWeight;
        this.computeUniform.cohesionWeight = panel.cohesionWeight;
        this.computeUniformDirty = true;
        this.context.bindBufferBase(this.context.UNIFORM_BUFFER, this.computeUniform.binding, this.computeUniform.buffer);
        this.context.uniformBlockBinding(this.computeProgram, this.computeUniform.index, this.computeUniform.binding);

        this.model = new GLTF();
        await this.model.loadModel('assets/Suzanne.gltf', true);
        this.model.createBuffer(this.context);

        const lightingShaderProgram = new LightingShaderProgram();
        lightingShaderProgram.creatProgram(this.context);
        const uniform = lightingShaderProgram.shaderUniform;
        uniform.createBuffer(this.context);
        uniform.ambientLightColor = Main.COLOR_AMBIENT_LIGHT;
        uniform.directionalLightColor = Main.COLOR_DIRECTIONAL_LIGHT;
        uniform.directionalLightDirection = vec3.fromValues(1.0, 1.0, 1.0);
        this.renderProgram = lightingShaderProgram;

        const instanceAttributeData = new Float32Array(Main.MAX_INSTANCE_NUM * 8);
        const instanceColorData = new Float32Array(Main.MAX_INSTANCE_NUM * 4);
        for(let i = 0; i < Main.MAX_INSTANCE_NUM; i++)
        {
            const idx = i * 8;
            // position
            instanceAttributeData[idx] = (Math.random() - 0.5) * 2;
            instanceAttributeData[idx + 1] = (Math.random() - 0.5) * 2;
            instanceAttributeData[idx + 2] = (Math.random() - 0.5) * 2;

            // padding
            instanceAttributeData[idx + 3] = 0.0;

            // velocity
            instanceAttributeData[idx + 4] = (Math.random() - 0.5) * 0.2;
            instanceAttributeData[idx + 5] = (Math.random() - 0.5) * 0.2;
            instanceAttributeData[idx + 6] = (Math.random() - 0.5) * 0.2;

            // padding
            instanceAttributeData[idx + 7] = 0.0;

            // color
            const color = RGB.createFromHSV(360 * Math.random(), 0.9, 0.9);
            const idx2 = i * 4;
            instanceColorData[idx2] = color.r;
            instanceColorData[idx2 + 1] = color.g;
            instanceColorData[idx2 + 2] = color.b;
            instanceColorData[idx2 + 3] = 1.0;
        }
        const instanceAttribute = this.model.getVertexBuffer('instancePosition').buffer;
        context.bindBuffer(context.ARRAY_BUFFER, instanceAttribute);
        context.bufferData(context.ARRAY_BUFFER, instanceAttributeData, this.context.STATIC_DRAW);
        this.ssboIn = instanceAttribute;
        this.ssboOut = context.createBuffer();
        context.bindBuffer(context.ARRAY_BUFFER, this.ssboOut);
        context.bufferData(context.ARRAY_BUFFER, instanceAttributeData, this.context.STATIC_DRAW);

        const instanceColor = this.model.getVertexBuffer('instanceColor').buffer;
        context.bindBuffer(context.ARRAY_BUFFER, instanceColor);
        context.bufferData(context.ARRAY_BUFFER, instanceColorData, this.context.STATIC_DRAW);

        // Initialize camera
        this.camera = new Camera(45 * Main.RAD, Main.CANVAS_WIDTH / Main.CANVAS_HEIGHT, 0.1, 1000.0);
        this.cameraController = new RoundCameraController(this.camera, this.canvas);
        this.canvas.style.cursor = 'move';
        this.cameraController.radius = 50;
        this.cameraController.radiusOffset = 5;
        this.cameraController.rotate(0, 0);

        this.render();
    }

    render()
    {
        this.stats.begin();

        // execute ComputeShader
        this.context.useProgram(this.computeProgram);
        // this.context.bindBuffer(this.context.SHADER_STORAGE_BUFFER, this.ssboIn);
        this.context.bindBufferBase(this.context.SHADER_STORAGE_BUFFER, 0, this.ssboIn);
        this.context.bindBufferBase(this.context.SHADER_STORAGE_BUFFER, 1, this.ssboOut);
        if(this.computeUniformDirty)
        {
            this.computeUniform.updateBuffer(this.context);
            this.computeUniformDirty = false;
        }
        this.context.dispatchCompute(this.numGroups, 1, 1);
        this.context.memoryBarrier(this.context.VERTEX_ATTRIB_ARRAY_BARRIER_BIT);

        /*
        this.context.bindBuffer(this.context.SHADER_STORAGE_BUFFER, this.ssboOut);
        const result:Float32Array = new Float32Array(this.numInstances * 4);
        this.context.getBufferSubData(this.context.SHADER_STORAGE_BUFFER, 0, result);
        console.log(result);
        */

        // render
        this.model.getVertexBuffer('instancePosition').buffer = this.ssboOut;
        this.model.getVertexBuffer('instanceVelocity').buffer = this.ssboOut;

        // Update camera
        this.cameraController.upDate(0.1);
        this.model.bindVertexbuffer(this.context, this.renderProgram);

        this.context.clear(this.context.COLOR_BUFFER_BIT);

        const uniform = (this.renderProgram).shaderUniform;
        uniform.vpMatrix = this.camera.getCameraMtx();
        uniform.updateBuffer(this.context);
        this.renderProgram.bindUniform(this.context);
        this.renderProgram.bindProgram(this.context);
        this.context.drawElementsInstanced(this.context.TRIANGLES, this.model.numIndices, this.context.UNSIGNED_SHORT, 0, this.numInstances);

        [this.ssboIn, this.ssboOut] = [this.ssboOut, this.ssboIn];

        this.stats.end();

        requestAnimationFrame(() => this.render());
    }
}

Main.RAD = Math.PI / 180;

Main.CANVAS_WIDTH = 512;
Main.CANVAS_HEIGHT = 512;

Main.COLOR_AMBIENT_LIGHT = vec4.fromValues(0.2, 0.2, 0.2, 1.0);
Main.COLOR_DIRECTIONAL_LIGHT = vec4.fromValues(0.8, 0.8, 0.8, 1.0);

Main.WORK_GROUP_SIZE = 256;
Main.MAX_INSTANCE_NUM = 1024 * 4;

window.addEventListener('DOMContentLoaded', () =>
{
    new Main();
});
