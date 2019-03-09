import {vec3} from '/gl-matrix.js';
import KeyboardEventName from './enum/events/KeyboardEventName.js';
import MouseEventName from './enum/events/MouseEventName.js';
import GestureEventName from './enum/events/GestureEventName.js';
import TouchEventName from './enum/events/TouchEventName.js';
import KeyCode from './enum/ui/KeyCode.js';
import {Camera} from './Camera.js';

export class RoundCameraController {
    RAD = Math.PI / 180.0;

    // parameter
    radiusMin = 1.0;
    radiusOffset = 0.1;
    gestureRadiusFactor = 20.0;

    // camera
    radius = 2.0;
    _camera;
    _stage;
    _target;
    _theta = 0.0;
    _oldX = 0.0;
    _phi = 90.0;
    _oldY = 0.0;

    _currentTheta = 0.0;
    _currentPhi = 90.0;

    // for mouse
    isMouseDown;

    // for touch
    _identifier;
    _oldRadius;
    _isGestureChange;

    constructor(camera, stage) {
        this._camera = camera;
        this._stage = stage;
        this._target = vec3.fromValues(0.0, 0.0, 0.0);
        this.enable();
        this._updateCamera();
    }

    enable() {
        document.addEventListener(KeyboardEventName.KEY_DOWN, (event) => {
            this._keyHandler(event);
        });
        document.addEventListener(MouseEventName.MOUSE_UP, (event) => {
            this._upHandler(event);
        });
        this._stage.addEventListener(MouseEventName.MOUSE_DOWN, (event) => {
            this._downHandler(event);
        });
        this._stage.addEventListener(MouseEventName.MOUSE_MOVE, (event) => {
            this._moveHandler(event);
        });
        this._stage.addEventListener(MouseEventName.MOUSE_WHEEL, (event) => {
            this._wheelHandler(event);
        });
        this._stage.addEventListener(MouseEventName.DOM_MOUSE_SCROLL, (event) => {
            this._domMouseScrollHandler(event);
        });

        // touch
        if ('ontouchstart' in window) {
            this._stage.addEventListener(TouchEventName.TOUCH_START, (event) => {
                this._touchStartHandler(event);
            });
            this._stage.addEventListener(TouchEventName.TOUCH_MOVE, (event) => {
                this._touchMoveHandler(event);
            });
            document.addEventListener(TouchEventName.TOUCH_END, (event) => {
                this._touchEndHandler(event);
            });
        }
        if ('ongesturestart' in window || 'GestureEvent' in window) {
            this._stage.addEventListener(GestureEventName.GESTURE_START, (event) => {
                this._gestureStartHandler(event);
            });
            this._stage.addEventListener(GestureEventName.GESTURE_CHANGE, (event) => {
                this._gestureChangeHandler(event);
            });
            document.addEventListener(GestureEventName.GESTURE_END, (event) => {
                this._gestureEndHandler(event);
            });
        }
    }

    _keyHandler(event) {
        switch (event.keyCode) {
            case KeyCode.UP:
                this.radius -= this.radiusOffset;
                if (this.radius < this.radiusMin) {
                    this.radius = this.radiusMin;
                }
                break;
            case KeyCode.DOWN:
                this.radius += this.radiusOffset;
                break;
            default:
                break;
        }
    }

    _upHandler(event) {
        this.isMouseDown = false;
    }

    _downHandler(event) {
        this.isMouseDown = true;
        let rect = (event.target).getBoundingClientRect();
        this._oldX = event.clientX - rect.left;
        this._oldY = event.clientY - rect.top;
    }

    _wheelHandler(event) {
        event.preventDefault();
        if (event.deltaY < 0) {
            this.radius -= this.radiusOffset;
            if (this.radius < this.radiusMin) {
                this.radius = this.radiusMin;
            }
        }
        else {
            this.radius += this.radiusOffset;
        }
    }

    _domMouseScrollHandler(event) {
        event.preventDefault();
        if (event.detail < 0) {
            this.radius -= this.radiusOffset;
            if (this.radius < this.radiusMin) {
                this.radius = this.radiusMin;
            }
        }
        else {
            this.radius += this.radiusOffset;
        }
    }

    _moveHandler(event) {
        if (this.isMouseDown) {
            let rect = (event.target).getBoundingClientRect();
            let stageX = event.clientX - rect.left;
            let stageY = event.clientY - rect.top;

            this.inputXY(stageX, stageY);
        }
    }

    _touchStartHandler(event) {
        event.preventDefault();
        if (!this.isMouseDown) {
            let touches = event.changedTouches;
            let touch = touches[0];
            this.isMouseDown = true;
            this._identifier = touch.identifier;
            let target = touch.target;
            this._oldX = touch.pageX - target.offsetLeft;
            this._oldY = touch.pageY - target.offsetTop;
        }
    }

    _touchMoveHandler(event) {
        event.preventDefault();
        if (this._isGestureChange) {
            return;
        }
        let touches = event.changedTouches;
        let touchLength = touches.length;
        for (let i = 0; i < touchLength; i++) {
            let touch = touches[i];
            if (touch.identifier === this._identifier) {
                let target = touch.target;
                let stageX = touch.pageX - target.offsetLeft;
                let stageY = touch.pageY - target.offsetTop;
                this.inputXY(stageX, stageY);
                break;
            }
        }
    }

    _touchEndHandler(event) {
        if (this.isMouseDown) {
            event.preventDefault();
        }
        this.isMouseDown = false;
    }

    _gestureStartHandler(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this._isGestureChange = true;
        this.isMouseDown = true;
        this._oldRadius = this.radius;
    }

    _gestureChangeHandler(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.radius = this._oldRadius + this.gestureRadiusFactor * this.radiusOffset * (1 - event.scale);
        if (this.radius < this.radiusMin) {
            this.radius = this.radiusMin;
        }
    }

    _gestureEndHandler(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this._isGestureChange = false;
        this.isMouseDown = false;
        this._identifier = -1;
    }

    inputXY(newX, newY) {
        this._theta -= (newX - this._oldX) * 0.3;
        this._oldX = newX;
        this._phi -= (newY - this._oldY) * 0.3;
        this._oldY = newY;
        //
        if (this._phi < 20) {
            this._phi = 20;
        }
        else if (this._phi > 160) {
            this._phi = 160;
        }
    }

    _updateCamera() {
        let t = this._currentTheta * RoundCameraController.RAD;
        let p = this._currentPhi * RoundCameraController.RAD;

        let rsin = this.radius * Math.sin(p);
        this._camera.x = rsin * Math.sin(t) + this._target[0];
        this._camera.z = rsin * Math.cos(t) + this._target[2];
        this._camera.y = this.radius * Math.cos(p) + this._target[1];

        this._camera.lookAt(this._target);
    }

    upDate(factor = 0.1) {
        this._currentTheta += (this._theta - this._currentTheta) * factor;
        this._currentPhi += (this._phi - this._currentPhi) * factor;

        this._updateCamera();
    }

    rotate(dTheta, dPhi) {
        this._theta += dTheta;
        this._phi += dPhi;
    }

    set(theta, phi) {
        this._theta = theta;
        this._phi = phi;
    }
}
RoundCameraController.RAD = Math.PI / 180.0;
