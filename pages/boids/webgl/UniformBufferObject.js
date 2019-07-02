export class UniformBufferObject {
    _name;

    get name() {
        return this._name;
    }

    _index;

    get index() {
        return this._index;
    }

    set index(value) {
        this._index = value;
    }

    _binding;

    get binding() {
        return this._binding;
    }

    set binding(value) {
        this._binding = value;
    }

    _bufferData;

    get bufferData() {
        return this._bufferData;
    }

    _bufferDataLength;

    get bufferDataLength() {
        return this._bufferDataLength;
    }

    _buffer;

    get buffer() {
        return this._buffer;
    }

    constructor(name, binding) {
        this._name = name;
        this._binding = binding;
    }

    createBuffer(gl2) {
        this._buffer = gl2.createBuffer();
        this._bufferData = new Float32Array(this._bufferDataLength);

        gl2.bindBuffer(gl2.UNIFORM_BUFFER, this._buffer);
        gl2.bufferData(gl2.UNIFORM_BUFFER, this._bufferData, gl2.DYNAMIC_DRAW);
        gl2.bindBuffer(gl2.UNIFORM_BUFFER, null);
    }

    updateBuffer(gl2) {
        gl2.bindBuffer(gl2.UNIFORM_BUFFER, this._buffer);
        gl2.bufferSubData(gl2.UNIFORM_BUFFER, 0, this._bufferData);
        gl2.bindBuffer(gl2.UNIFORM_BUFFER, null);
    }

    _copyData(data, offset, count) {
        for (let i = 0; i < count; i++) {
            this._bufferData[offset + i] = data[i];
        }
    }

    _copyNumberData(data, offset) {
        this._bufferData[offset] = data;
    }
}
