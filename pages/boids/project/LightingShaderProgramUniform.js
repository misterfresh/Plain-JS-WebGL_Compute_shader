import {UniformBufferObject} from '../webgl/UniformBufferObject.js';

export class LightingShaderProgramUniform extends UniformBufferObject {
    BUFFER_LENGTH = 48;

    // Layout
    // 0-15 = vpMatrix:mat4
    // 16-19 = ambientLightColor:vec4
    // 20-23 = directionalLightColor:vec4
    // 24-26 = directionalLightDirection:vec3
    // 27 = padding

    get vpMatrix() {
        return this._bufferData.subarray(0, 16);
    }

    set vpMatrix(value) {
        this._copyData(value, 0, 16);
    }

    get ambientLightColor() {
        return this._bufferData.subarray(16, 20);
    }

    set ambientLightColor(value) {
        this._copyData(value, 16, 4);
    }

    get directionalLightColor() {
        return this._bufferData.subarray(20, 24);
    }

    set directionalLightColor(value) {
        this._copyData(value, 20, 4);
    }

    get directionalLightDirection() {
        return this._bufferData.subarray(24, 27);
    }

    set directionalLightDirection(value) {
        this._copyData(value, 24, 3);
    }

    constructor(name, binding) {
        super(name, binding);
        this._bufferDataLength = LightingShaderProgramUniform.BUFFER_LENGTH;
    }
}

LightingShaderProgramUniform.BUFFER_LENGTH = 48;
