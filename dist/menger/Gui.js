import { Camera } from "../lib/webglutils/Camera.js";
import { Vec3 } from "../lib/TSM.js";
export class GUI {
    constructor(canvas, animation, sponge) {
        this.height = canvas.height;
        this.width = canvas.width;
        this.prevX = 0;
        this.prevY = 0;
        this.sponge = sponge;
        this.animation = animation;
        this.reset();
        this.registerEventListeners(canvas);
    }
    reset() {
        this.fps = false;
        this.dragging = false;
        this.camera = new Camera(new Vec3([0, 0, -6]), new Vec3([0, 0, 0]), new Vec3([0, 1, 0]), 45, this.width / this.height, 0.1, 1000.0);
    }
    setCamera(pos, target, upDir, fov, aspect, zNear, zFar) {
        this.camera = new Camera(pos, target, upDir, fov, aspect, zNear, zFar);
    }
    viewMatrix() {
        return this.camera.viewMatrix();
    }
    projMatrix() {
        return this.camera.projMatrix();
    }
    dragStart(mouse) {
        this.dragging = true;
        this.prevX = mouse.screenX;
        this.prevY = mouse.screenY;
    }
    drag(mouse) {
        if (!this.dragging)
            return;
        const dx = mouse.screenX - this.prevX;
        const dy = mouse.screenY - this.prevY;
        if (dx === 0 && dy === 0)
            return;
        if (mouse.buttons & 1) {
            if (mouse.shiftKey) {
                // cube animation
                const dragDir = Vec3.sum(this.camera.right().scale(dx), this.camera.up().scale(-dy));
                let axis = Vec3.cross(dragDir, this.camera.forward());
                if (axis.length() > 0.0001) {
                    axis.normalize();
                    const speed = dragDir.length() * 0.005;
                    this.sponge.addSpin(axis, speed);
                }
            }
            else {
                const dragDir = Vec3.sum(this.camera.right().scale(dx), this.camera.up().scale(-dy));
                const axis = Vec3.cross(dragDir, this.camera.forward());
                this.camera.rotate(axis, GUI.rotationSpeed);
            }
        }
        else if (mouse.buttons & 2) {
            this.camera.offsetDist(dy * GUI.zoomSpeed);
        }
        this.prevX = mouse.screenX;
        this.prevY = mouse.screenY;
    }
    dragEnd(mouse) {
        this.dragging = false;
        this.prevX = 0;
        this.prevY = 0;
    }
    onKeydown(key) {
        switch (key.code) {
            case "KeyW": {
                const f = this.camera.forward();
                this.camera.offset(f, -GUI.zoomSpeed, true);
                break;
            }
            case "KeyS": {
                const f = this.camera.forward();
                this.camera.offset(f, GUI.zoomSpeed, true);
                break;
            }
            case "KeyA": {
                const r = this.camera.right();
                this.camera.offset(r, -GUI.panSpeed, true);
                break;
            }
            case "KeyD": {
                const r = this.camera.right();
                this.camera.offset(r, GUI.panSpeed, true);
                break;
            }
            case "KeyR": {
                this.camera.offset(this.camera.up(), GUI.panSpeed, true);
                break;
            }
            case "ArrowLeft": {
                this.camera.roll(GUI.rollSpeed, false);
                break;
            }
            case "ArrowRight": {
                this.camera.roll(GUI.rollSpeed, true);
                break;
            }
            case "ArrowUp": {
                this.camera.offset(this.camera.up(), GUI.panSpeed, true);
                break;
            }
            case "ArrowDown": {
                this.camera.offset(this.camera.up(), -GUI.panSpeed, true);
                break;
            }
            case "Digit1": {
                this.sponge.setLevel(1);
                break;
            }
            case "Digit2": {
                this.sponge.setLevel(2);
                break;
            }
            case "Digit3": {
                this.sponge.setLevel(3);
                break;
            }
            case "Digit4": {
                this.sponge.setLevel(4);
                break;
            }
            default: {
                console.log("Key : '", key.code, "' was pressed.");
                break;
            }
        }
    }
    registerEventListeners(canvas) {
        window.addEventListener("keydown", (key) => this.onKeydown(key));
        canvas.addEventListener("mousedown", (mouse) => this.dragStart(mouse));
        canvas.addEventListener("mousemove", (mouse) => this.drag(mouse));
        canvas.addEventListener("mouseup", (mouse) => this.dragEnd(mouse));
        canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    }
}
GUI.rotationSpeed = 0.05;
GUI.zoomSpeed = 0.1;
GUI.rollSpeed = 0.1;
GUI.panSpeed = 0.1;
//# sourceMappingURL=Gui.js.map