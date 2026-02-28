import { Camera } from "../lib/webglutils/Camera.js";
import { CanvasAnimation } from "../lib/webglutils/CanvasAnimation.js";
import { MengerSponge } from "./MengerSponge.js";
import { Mat4, Vec3 } from "../lib/TSM.js";

interface IGUI {
  viewMatrix(): Mat4;
  projMatrix(): Mat4;
  dragStart(me: MouseEvent): void;
  drag(me: MouseEvent): void;
  dragEnd(me: MouseEvent): void;
  onKeydown(ke: KeyboardEvent): void;
}

export class GUI implements IGUI {
  private static readonly rotationSpeed: number = 0.05;
  private static readonly zoomSpeed: number = 0.1;
  private static readonly rollSpeed: number = 0.1;
  private static readonly panSpeed: number = 0.1;

  private camera: Camera;
  private dragging: boolean;
  private fps: boolean;
  private prevX: number;
  private prevY: number;

  private height: number;
  private width: number;

  private sponge: MengerSponge;
  private animation: CanvasAnimation;

  constructor(
    canvas: HTMLCanvasElement,
    animation: CanvasAnimation,
    sponge: MengerSponge
  ) {
    this.height = canvas.height;
    this.width = canvas.width;
    this.prevX = 0;
    this.prevY = 0;

    this.sponge = sponge;
    this.animation = animation;

    this.reset();

    this.registerEventListeners(canvas);
  }

  public reset(): void {
    this.fps = false;
    this.dragging = false;
    this.camera = new Camera(
      new Vec3([0, 0, -6]),
      new Vec3([0, 0, 0]),
      new Vec3([0, 1, 0]),
      45,
      this.width / this.height,
      0.1,
      1000.0
    );
  }

  public setCamera(
    pos: Vec3,
    target: Vec3,
    upDir: Vec3,
    fov: number,
    aspect: number,
    zNear: number,
    zFar: number
  ) {
    this.camera = new Camera(pos, target, upDir, fov, aspect, zNear, zFar);
  }

  public viewMatrix(): Mat4 {
    return this.camera.viewMatrix();
  }

  public projMatrix(): Mat4 {
    return this.camera.projMatrix();
  }

  public dragStart(mouse: MouseEvent): void {
    this.dragging = true;
    this.prevX = mouse.screenX;
    this.prevY = mouse.screenY;
  }

  public drag(mouse: MouseEvent): void {
    if (!this.dragging) return;

    const dx = mouse.screenX - this.prevX;
    const dy = mouse.screenY - this.prevY;

    if (mouse.buttons & 1) {
      this.camera.yaw(dx * GUI.rotationSpeed, dx > 0);
      this.camera.pitch(dy * GUI.rotationSpeed, dy > 0);
    } else if (mouse.buttons & 2) {
      this.camera.offsetDist(dy * GUI.zoomSpeed);
    }

    this.prevX = mouse.screenX;
    this.prevY = mouse.screenY;
  }

  public dragEnd(mouse: MouseEvent): void {
    this.dragging = false;
    this.prevX = 0;
    this.prevY = 0;
  }

  public onKeydown(key: KeyboardEvent): void {
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

  private registerEventListeners(canvas: HTMLCanvasElement): void {
    window.addEventListener("keydown", (key: KeyboardEvent) =>
      this.onKeydown(key)
    );

    canvas.addEventListener("mousedown", (mouse: MouseEvent) =>
      this.dragStart(mouse)
    );

    canvas.addEventListener("mousemove", (mouse: MouseEvent) =>
      this.drag(mouse)
    );

    canvas.addEventListener("mouseup", (mouse: MouseEvent) =>
      this.dragEnd(mouse)
    );

    canvas.addEventListener("contextmenu", (event: any) =>
      event.preventDefault()
    );
  }
}