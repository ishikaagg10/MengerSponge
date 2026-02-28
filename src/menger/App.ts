import {
  CanvasAnimation,
  WebGLUtilities
} from "../lib/webglutils/CanvasAnimation.js";
import { GUI } from "./Gui.js";
import { MengerSponge } from "./MengerSponge.js";
import { mengerTests } from "./tests/MengerTests.js";
import {
  defaultFSText,
  defaultVSText,
  floorFSText,
  floorVSText
} from "./Shaders.js";
import { Mat4, Vec4 } from "../lib/TSM.js";

export interface MengerAnimationTest {
  reset(): void;
  setLevel(level: number): void;
  getGUI(): GUI;
  draw(): void;
}

export class MengerAnimation extends CanvasAnimation {
  private gui: GUI;
  
  /* The Menger sponge */
  private sponge: MengerSponge = new MengerSponge(1);

  /* Menger Sponge Rendering Info */
  private mengerVAO: WebGLVertexArrayObjectOES = -1;
  private mengerProgram: WebGLProgram = -1;

  /* Menger Buffers */
  private mengerPosBuffer: WebGLBuffer = -1;
  private mengerIndexBuffer: WebGLBuffer = -1;
  private mengerNormBuffer: WebGLBuffer = -1;

  /* Menger Attribute Locations */
  private mengerPosAttribLoc: GLint = -1;
  private mengerNormAttribLoc: GLint = -1;

  /* Menger Uniform Locations */
  private mengerWorldUniformLocation: WebGLUniformLocation = -1;
  private mengerViewUniformLocation: WebGLUniformLocation = -1;
  private mengerProjUniformLocation: WebGLUniformLocation = -1;
  private mengerLightUniformLocation: WebGLUniformLocation = -1;

  /* Global Rendering Info */
  private lightPosition: Vec4 = new Vec4();
  private backgroundColor: Vec4 = new Vec4();

  /* Floor Rendering Info */
  private floorVAO: WebGLVertexArrayObjectOES = -1;
  private floorProgram: WebGLProgram = -1;
  private floorPosBuffer: WebGLBuffer = -1;
  private floorIndexBuffer: WebGLBuffer = -1;
  private floorPosAttribLoc: GLint = -1;
  private floorViewUniformLocation: WebGLUniformLocation = -1;
  private floorProjUniformLocation: WebGLUniformLocation = -1;
  private floorLightUniformLocation: WebGLUniformLocation = -1;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this.gui = new GUI(canvas, this, this.sponge);
    this.reset();
  }

  public reset(): void {
    this.lightPosition = new Vec4([-10.0, 10.0, -10.0, 1.0]);
    this.backgroundColor = new Vec4([0.0, 0.37254903, 0.37254903, 1.0]);
    this.initMenger();
    this.initFloor();
    this.gui.reset();
  }

  public initMenger(): void {
    this.sponge.setLevel(1);
    
    const gl: WebGLRenderingContext = this.ctx;

    this.mengerProgram = WebGLUtilities.createProgram(gl, defaultVSText, defaultFSText);
    gl.useProgram(this.mengerProgram);

    this.mengerVAO = this.extVAO.createVertexArrayOES() as WebGLVertexArrayObjectOES;
    this.extVAO.bindVertexArrayOES(this.mengerVAO);

    this.mengerPosAttribLoc = gl.getAttribLocation(this.mengerProgram, "vertPosition");
    this.mengerPosBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.mengerPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.sponge.positionsFlat(), gl.STATIC_DRAW);
    gl.vertexAttribPointer(this.mengerPosAttribLoc, 4, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(this.mengerPosAttribLoc);

    this.mengerNormAttribLoc = gl.getAttribLocation(this.mengerProgram, "aNorm");
    this.mengerNormBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.mengerNormBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.sponge.normalsFlat(), gl.STATIC_DRAW);
    gl.vertexAttribPointer(this.mengerNormAttribLoc, 4, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(this.mengerNormAttribLoc);

    this.mengerIndexBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mengerIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.sponge.indicesFlat(), gl.STATIC_DRAW);

    this.extVAO.bindVertexArrayOES(this.mengerVAO);

    this.mengerWorldUniformLocation = gl.getUniformLocation(this.mengerProgram, "mWorld") as WebGLUniformLocation;
    this.mengerViewUniformLocation = gl.getUniformLocation(this.mengerProgram, "mView") as WebGLUniformLocation;
    this.mengerProjUniformLocation = gl.getUniformLocation(this.mengerProgram, "mProj") as WebGLUniformLocation;
    this.mengerLightUniformLocation = gl.getUniformLocation(this.mengerProgram, "lightPosition") as WebGLUniformLocation;

    gl.uniformMatrix4fv(this.mengerWorldUniformLocation, false, new Float32Array(this.sponge.uMatrix().all()));
    gl.uniformMatrix4fv(this.mengerViewUniformLocation, false, new Float32Array(Mat4.identity.all()));
    gl.uniformMatrix4fv(this.mengerProjUniformLocation, false, new Float32Array(Mat4.identity.all()));
    gl.uniform4fv(this.mengerLightUniformLocation, this.lightPosition.xyzw);
  }

  public initFloor(): void {
    const gl = this.ctx;

    this.floorProgram = WebGLUtilities.createProgram(gl, floorVSText, floorFSText);
    gl.useProgram(this.floorProgram);

    this.floorVAO = this.extVAO.createVertexArrayOES() as WebGLVertexArrayObjectOES;
    this.extVAO.bindVertexArrayOES(this.floorVAO);

    const floorSize = 100.0;
    const floorY = -2.0;
    const floorPositions = new Float32Array([
      -floorSize, floorY, -floorSize, 1.0,
       floorSize, floorY, -floorSize, 1.0,
       floorSize, floorY,  floorSize, 1.0,
      -floorSize, floorY,  floorSize, 1.0,
    ]);
    const floorIndices = new Uint32Array([0, 2, 1, 0, 3, 2]);

    this.floorPosAttribLoc = gl.getAttribLocation(this.floorProgram, "vertPosition");
    this.floorPosBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.floorPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, floorPositions, gl.STATIC_DRAW);
    gl.vertexAttribPointer(this.floorPosAttribLoc, 4, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(this.floorPosAttribLoc);

    this.floorIndexBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.floorIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, floorIndices, gl.STATIC_DRAW);

    this.floorViewUniformLocation = gl.getUniformLocation(this.floorProgram, "mView") as WebGLUniformLocation;
    this.floorProjUniformLocation = gl.getUniformLocation(this.floorProgram, "mProj") as WebGLUniformLocation;
    this.floorLightUniformLocation = gl.getUniformLocation(this.floorProgram, "lightPosition") as WebGLUniformLocation;

    this.extVAO.bindVertexArrayOES(this.floorVAO);
  }

  public draw(): void {
    const gl: WebGLRenderingContext = this.ctx;

    const bg: Vec4 = this.backgroundColor;
    gl.clearColor(bg.r, bg.g, bg.b, bg.a);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    /* Draw floor first - disable culling so floor is visible from both sides */
    gl.disable(gl.CULL_FACE);
    gl.useProgram(this.floorProgram);
    this.extVAO.bindVertexArrayOES(this.floorVAO);
    gl.uniformMatrix4fv(this.floorViewUniformLocation, false, new Float32Array(this.gui.viewMatrix().all()));
    gl.uniformMatrix4fv(this.floorProjUniformLocation, false, new Float32Array(this.gui.projMatrix().all()));
    gl.uniform4fv(this.floorLightUniformLocation, this.lightPosition.xyzw);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);

    /* Re-enable culling for the sponge */
    gl.enable(gl.CULL_FACE);

    /* Menger - Update/Draw */
    const modelMatrix = this.sponge.uMatrix();
    gl.useProgram(this.mengerProgram);
    this.extVAO.bindVertexArrayOES(this.mengerVAO);

    if (this.sponge.isDirty()) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.mengerPosBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.sponge.positionsFlat(), gl.STATIC_DRAW);
      gl.vertexAttribPointer(this.mengerPosAttribLoc, 4, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);
      gl.enableVertexAttribArray(this.mengerPosAttribLoc);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.mengerNormBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.sponge.normalsFlat(), gl.STATIC_DRAW);
      gl.vertexAttribPointer(this.mengerNormAttribLoc, 4, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);
      gl.enableVertexAttribArray(this.mengerNormAttribLoc);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mengerIndexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.sponge.indicesFlat(), gl.STATIC_DRAW);

      this.sponge.setClean();
    }

    gl.uniformMatrix4fv(this.mengerWorldUniformLocation, false, new Float32Array(modelMatrix.all()));
    gl.uniformMatrix4fv(this.mengerViewUniformLocation, false, new Float32Array(this.gui.viewMatrix().all()));
    gl.uniformMatrix4fv(this.mengerProjUniformLocation, false, new Float32Array(this.gui.projMatrix().all()));

    gl.drawElements(gl.TRIANGLES, this.sponge.indicesFlat().length, gl.UNSIGNED_INT, 0);
  }

  public setLevel(level: number): void {
    this.sponge.setLevel(level);
  }

  public getGUI(): GUI {
    return this.gui;
  }
}

export function initializeCanvas(): void {
  const canvas = document.getElementById("glCanvas") as HTMLCanvasElement;
  const canvasAnimation: MengerAnimation = new MengerAnimation(canvas);
  mengerTests.registerDeps(canvasAnimation);
  mengerTests.registerDeps(canvasAnimation);
  canvasAnimation.start();
}