import {Primitive} from '../webgl/Primitive.js';
import { GLTFLoader} from './GLTFLoader.js';

export class GLTF extends Primitive {
    _bufferData;

    get bufferData() {
        return this._bufferData;
    }

    _indeces;

    get indeces() {
        return this._indeces;
    }

    constructor() {
        super();
    }

    async loadModel(url, centering = false) {
        const data = await GLTFLoader.load(url);

        this._indeces = data.indices.data;
        this._numIndices = this._indeces.length;

        this._numAttributes = data.position.num + data.normal.num;
        this._numVertices = data.numVertices;

        let centerX = 0.0;
        let centerY = 0.0;
        let centerZ = 0.0;
        if (centering) {
            const posMin = data.position.min;
            const posMax = data.position.max;
            centerX = (posMax[0] - posMin[0]) / 2 + posMin[0];
            centerY = (posMax[1] - posMin[1]) / 2 + posMin[1];
            centerZ = (posMax[2] - posMin[2]) / 2 + posMin[2];
        }

        this._bufferData = new Float32Array(this._numAttributes * this._numVertices);
        for (let i = 0; i < this._numVertices; i++) {
            const bufferVertexOffset = i * 6;
            const sourceVertexOffset = i * 3;
            this._bufferData[bufferVertexOffset] = data.position.data[sourceVertexOffset] - centerX;
            this._bufferData[bufferVertexOffset + 1] = data.position.data[sourceVertexOffset + 1] - centerY;
            this._bufferData[bufferVertexOffset + 2] = data.position.data[sourceVertexOffset + 2] - centerZ;

            this._bufferData[bufferVertexOffset + 3] = data.normal.data[sourceVertexOffset];
            this._bufferData[bufferVertexOffset + 4] = data.normal.data[sourceVertexOffset + 1];
            this._bufferData[bufferVertexOffset + 5] = data.normal.data[sourceVertexOffset + 2];
        }
    }

    createBuffer(gl) {
        let buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._bufferData), gl.STATIC_DRAW);

        const positionAttribute = {
            name: 'position',
            byteStride: 24,
            bufferOffset: 0,
            buffer: buffer,
            divisor: -1
        };
        this.vboList.push(positionAttribute);

        const normalAttribute = {
            name: 'normal',
            byteStride: 24,
            bufferOffset: 12,
            buffer: buffer,
            divisor: -1
        };
        this.vboList.push(normalAttribute);

        buffer = gl.createBuffer();

        const instancePositionAttribute = {
            name: 'instancePosition',
            byteStride: 32,
            bufferOffset: 0,
            buffer: buffer,
            divisor: 1
        };
        this.vboList.push(instancePositionAttribute);

        const instanceVelocityAttribute = {
            name: 'instanceVelocity',
            byteStride: 32,
            bufferOffset: 16,
            buffer: buffer,
            divisor: 1
        };
        this.vboList.push(instanceVelocityAttribute);

        buffer = gl.createBuffer();

        const instanceColorAttribute = {
            name: 'instanceColor',
            byteStride: 16,
            bufferOffset: 0,
            buffer: buffer,
            divisor: 1
        };
        this.vboList.push(instanceColorAttribute);

        this._indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._indeces), gl.STATIC_DRAW);
    }
}
