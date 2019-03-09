//import {ProgramObject, ShaderAttribute} from './ProgramObject.js';

export class Primitive {
    _numAttributes;

    get numAttributes() {
        return this._numAttributes;
    }

    _numVertices;

    get numVertices() {
        return this._numVertices;
    }

    _numIndices;

    get numIndices() {
        return this._numIndices;
    }

    _indexBuffer;

    get indexBuffer() {
        return this._indexBuffer;
    }

    vboList;

    constructor() {
        this.vboList = [];
    }

    createBuffer(gl) {
    }

    bindVertexbuffer(gl2, program) {
        const length = program.attributeList.length;
        for (let i = 0; i < length; i++) {
            const shaderAttibute = program.attributeList[i];
            if (shaderAttibute.location >= 0) {
                let vertexAttribute = this.getVertexBuffer(shaderAttibute.name);
                if (vertexAttribute) {
                    gl2.bindBuffer(gl2.ARRAY_BUFFER, vertexAttribute.buffer);
                    gl2.enableVertexAttribArray(shaderAttibute.location);
                    gl2.vertexAttribPointer(shaderAttibute.location, shaderAttibute.stride, gl2.FLOAT, false, vertexAttribute.byteStride, vertexAttribute.bufferOffset);

                    if (vertexAttribute.divisor > 0) {
                        gl2.vertexAttribDivisor(shaderAttibute.location, vertexAttribute.divisor);
                    }
                }
            }
        }
    }

    getVertexBuffer(attributeName) {
        const length = this.vboList.length;
        for (let i = 0; i < length; i++) {
            let attribute = this.vboList[i];
            if (attribute.name === attributeName) {
                return attribute;
            }
        }
        return null;
    }
}
