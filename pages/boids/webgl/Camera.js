import {mat4, vec3} from '/dependencies/gl-matrix.js';

export class Camera {
    DIRECTION = vec3.fromValues(0.0, 0.0, 1.0);
    //
    _cameraUP = vec3.fromValues(0.0, 1.0, 0.0);
    //
    _projectionMtx = mat4.identity(mat4.create());
    _cameraMtx = mat4.identity(mat4.create());
    _lookMtx = mat4.identity(mat4.create());
    //
    x = 0.0;
    y = 0.0;
    z = 0.0;

    constructor(fov, aspect, zNear, zFar) {
        mat4.perspective(this._projectionMtx, fov, aspect, zNear, zFar);
    }

    getCameraMtx() {
        return this._cameraMtx;
    }

    lookAt(point) {
        mat4.identity(this._lookMtx);
        mat4.lookAt(this._lookMtx, vec3.fromValues(this.x, this.y, this.z), point, this._cameraUP);
        mat4.multiply(this._cameraMtx, this._projectionMtx, this._lookMtx);
    }
}
Camera.DIRECTION = vec3.fromValues(0.0, 0.0, 1.0);
