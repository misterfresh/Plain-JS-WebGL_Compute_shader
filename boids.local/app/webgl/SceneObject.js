import {mat4, vec3} from '/gl-matrix.js';

export class SceneObject {
    _mMatrix = mat4.identity(mat4.create());
    _translateVec = vec3.create();
    _scaleVec = vec3.create();

    x = 0.0;
    y = 0.0;
    z = 0.0;
    scaleX = 1.0;
    scaleY = 1.0;
    scaleZ = 1.0;
    rotationX = 0.0;
    rotationY = 0.0;
    rotationZ = 0.0;

    constructor() {
    }

    getModelMtx() {
        mat4.identity(this._mMatrix);
        vec3.set(this._translateVec, this.x, this.y, this.z);
        mat4.translate(this._mMatrix, this._mMatrix, this._translateVec);
        mat4.rotateZ(this._mMatrix, this._mMatrix, this.rotationZ);
        mat4.rotateY(this._mMatrix, this._mMatrix, this.rotationY);
        mat4.rotateX(this._mMatrix, this._mMatrix, this.rotationX);
        vec3.set(this._scaleVec, this.scaleX, this.scaleY, this.scaleZ);
        mat4.scale(this._mMatrix, this._mMatrix, this._scaleVec);
        return this._mMatrix;
    }
}
