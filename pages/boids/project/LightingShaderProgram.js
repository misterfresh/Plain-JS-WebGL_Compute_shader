import {ProgramObject} from '../webgl/ProgramObject.js';
import {LightingShaderProgramUniform} from './LightingShaderProgramUniform.js';
import vertexShaderSource from '../../boids_vertex_shader_glsl.js'
import fragmentShaderSource from '../../boids_fragment_shader_glsl.js'

export class LightingShaderProgram extends ProgramObject {

    get shaderUniform() {
        return this._uniformList[0]
    }

    init() {
        // language=GLSL
        this._vertexShaderSource = vertexShaderSource;

        // language=GLSL
        this._fragmentShaderSource = fragmentShaderSource;

        this._uniformList[0] = new LightingShaderProgramUniform('Uniforms', 0);

        this.attributeList[0] = {
            name: 'position',
            stride: 3,
            location: -1
        };

        this.attributeList[1] = {
            name: 'normal',
            stride: 3,
            location: -1
        };

        this.attributeList[2] = {
            name: 'instancePosition',
            stride: 3,
            location: -1
        };

        this.attributeList[3] = {
            name: 'instanceVelocity',
            stride: 3,
            location: -1
        };

        this.attributeList[4] = {
            name: 'instanceColor',
            stride: 4,
            location: -1
        };
    }
}
