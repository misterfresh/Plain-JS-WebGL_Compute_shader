import {UniformBufferObject} from './UniformBufferObject.js';

export class ProgramObject {
    _program;

    get program() {
        return this._program;
    }

    _attributeList;

    get attributeList() {
        return this._attributeList;
    }

    _uniformList;

    get uniformList() {
        return this._uniformList;
    }

    _vertexShaderSource;
    _fragmentShaderSource;

    constructor() {
        this._uniformList = [];
        this._attributeList = [];
        this.init();
    }

    init() {

    }

    creatProgram(gl2) {
        const vShader = this.creatShader(gl2, this._vertexShaderSource, gl2.VERTEX_SHADER);
        const fShader = this.creatShader(gl2, this._fragmentShaderSource, gl2.FRAGMENT_SHADER);

        this._program = gl2.createProgram();
        gl2.attachShader(this._program, vShader);
        gl2.attachShader(this._program, fShader);

        gl2.linkProgram(this._program);

        let i;
        let length;

        length = this._attributeList.length;
        for (i = 0; i < length; i++) {
            const attribute = this._attributeList[i];
            if (attribute.location === -1) {
                attribute.location = gl2.getAttribLocation(this._program, attribute.name);
            }
        }

        length = this._uniformList.length;
        for (i = 0; i < length; i++) {
            const uniform = this._uniformList[i];
            uniform.index = gl2.getUniformBlockIndex(this._program, uniform.name);
        }
    }

    creatShader(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            return shader;
        }
        else {
            console.log(type === gl.VERTEX_SHADER, gl.getShaderInfoLog(shader));
            return null;
        }
    }

    bindShader(gl2) {
        this.bindProgram(gl2);
        this.bindUniform(gl2);
    }

    bindProgram(gl) {
        if (gl.getProgramParameter(this._program, gl.LINK_STATUS)) {
            gl.useProgram(this._program);
        }
        else {
            console.log(gl.getProgramInfoLog(this._program));
        }
    }

    bindUniform(gl2) {
        const length = this._uniformList.length;
        for (let i = 0; i < length; i++) {
            const uniform = this._uniformList[i];
            gl2.bindBufferBase(gl2.UNIFORM_BUFFER, uniform.binding, uniform.buffer);
            gl2.uniformBlockBinding(this.program, uniform.index, uniform.binding);
        }
    }
}

