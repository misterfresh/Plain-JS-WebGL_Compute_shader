import {UniformBufferObject} from '../webgl/UniformBufferObject.js';

export class ComputeShaderProgramUniform extends UniformBufferObject {
    BUFFER_LENGTH = 4;

    // Layout
    // 0 = separateWeight:float
    // 1 = alignmentWeight:float
    // 2 = cohesionWeight:float
    // 3 = padding

    get separateWeight() {
        return this._bufferData.subarray(0, 1)[0];
    }

    set separateWeight(value) {
        this._copyNumberData(value, 0);
    }

    get alignmentWeight() {
        return this._bufferData.subarray(1, 2)[0];
    }

    set alignmentWeight(value) {
        this._copyNumberData(value, 1);
    }

    get cohesionWeight() {
        return this._bufferData.subarray(2, 3)[0];
    }

    set cohesionWeight(value) {
        this._copyNumberData(value, 2);
    }

    constructor(name, binding) {
        super(name, binding);
        this._bufferDataLength = ComputeShaderProgramUniform.BUFFER_LENGTH;
    }
}
ComputeShaderProgramUniform.BUFFER_LENGTH = 4;
