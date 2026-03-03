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
  floorVSText,
  shadowVSText,
  shadowFSText,
  skyboxVSText,
  skyboxFSText
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
  private floorIndexCount: number = 0;

  /* Shadow Rendering Info */
  private shadowVAO: WebGLVertexArrayObjectOES = -1;
  private shadowProgram: WebGLProgram = -1;
  private shadowPosAttribLoc: GLint = -1;
  private shadowWorldUniformLocation: WebGLUniformLocation = -1;
  private shadowViewUniformLocation: WebGLUniformLocation = -1;
  private shadowProjUniformLocation: WebGLUniformLocation = -1;
  private shadowLightUniformLocation: WebGLUniformLocation = -1;

  /* Skybox Rendering Info */
  private skyboxVAO: WebGLVertexArrayObjectOES = -1;
  private skyboxProgram: WebGLProgram = -1;
  private skyboxPosBuffer: WebGLBuffer = -1;
  private skyboxIndexBuffer: WebGLBuffer = -1;
  private skyboxPosAttribLoc: GLint = -1;
  private skyboxViewUniformLocation: WebGLUniformLocation = -1;
  private skyboxProjUniformLocation: WebGLUniformLocation = -1;
  private skyboxIndexCount: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this.gui = new GUI(canvas, this, this.sponge);
    this.reset();
  }

  public reset(): void {
    this.lightPosition = new Vec4([-10.0, 10.0, -10.0, 1.0]);
    this.backgroundColor = new Vec4([0.0, 0.0, 0.0, 1.0]);
    this.initSkybox();
    this.initMenger();
    this.initFloor();
    this.gui.reset();
  }

  public initSkybox(): void {
    const gl: WebGLRenderingContext = this.ctx;

    this.skyboxProgram = WebGLUtilities.createProgram(gl, skyboxVSText, skyboxFSText);
    gl.useProgram(this.skyboxProgram);

    this.skyboxVAO = this.extVAO.createVertexArrayOES() as WebGLVertexArrayObjectOES;
    this.extVAO.bindVertexArrayOES(this.skyboxVAO);

    const S = 1.0;
    const positions = new Float32Array([
      -S, -S, -S,  // 0
       S, -S, -S,  // 1
       S,  S, -S,  // 2
      -S,  S, -S,  // 3
      -S, -S,  S,  // 4
       S, -S,  S,  // 5
       S,  S,  S,  // 6
      -S,  S,  S,  // 7
    ]);

    const indices = new Uint16Array([
      0, 2, 1,  0, 3, 2,   // -Z
      4, 5, 6,  4, 6, 7,   // +Z
      0, 4, 7,  0, 7, 3,   // -X
      1, 2, 6,  1, 6, 5,   // +X
      0, 1, 5,  0, 5, 4,   // -Y
      3, 7, 6,  3, 6, 2,   // +Y
    ]);
    this.skyboxIndexCount = indices.length;

    this.skyboxPosAttribLoc = gl.getAttribLocation(this.skyboxProgram, "vertPosition");

    this.skyboxPosBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.skyboxPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.vertexAttribPointer(
      this.skyboxPosAttribLoc, 3, gl.FLOAT, false,
      3 * Float32Array.BYTES_PER_ELEMENT, 0
    );
    gl.enableVertexAttribArray(this.skyboxPosAttribLoc);

    this.skyboxIndexBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.skyboxIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    this.skyboxViewUniformLocation =
      gl.getUniformLocation(this.skyboxProgram, "mView") as WebGLUniformLocation;
    this.skyboxProjUniformLocation =
      gl.getUniformLocation(this.skyboxProgram, "mProj") as WebGLUniformLocation;

    this.extVAO.bindVertexArrayOES(null);
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

    this.mengerWorldUniformLocation = gl.getUniformLocation(this.mengerProgram, "mWorld") as WebGLUniformLocation;
    this.mengerViewUniformLocation = gl.getUniformLocation(this.mengerProgram, "mView") as WebGLUniformLocation;
    this.mengerProjUniformLocation = gl.getUniformLocation(this.mengerProgram, "mProj") as WebGLUniformLocation;
    this.mengerLightUniformLocation = gl.getUniformLocation(this.mengerProgram, "lightPosition") as WebGLUniformLocation;

    gl.uniformMatrix4fv(this.mengerWorldUniformLocation, false, new Float32Array(this.sponge.uMatrix().all()));
    gl.uniformMatrix4fv(this.mengerViewUniformLocation, false, new Float32Array(Mat4.identity.all()));
    gl.uniformMatrix4fv(this.mengerProjUniformLocation, false, new Float32Array(Mat4.identity.all()));
    gl.uniform4fv(this.mengerLightUniformLocation, this.lightPosition.xyzw);

    this.extVAO.bindVertexArrayOES(null);

    this.shadowProgram = WebGLUtilities.createProgram(gl, shadowVSText, shadowFSText);
    gl.useProgram(this.shadowProgram);

    this.shadowVAO = this.extVAO.createVertexArrayOES() as WebGLVertexArrayObjectOES;
    this.extVAO.bindVertexArrayOES(this.shadowVAO);

    this.shadowPosAttribLoc = gl.getAttribLocation(this.shadowProgram, "vertPosition");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.mengerPosBuffer);
    gl.vertexAttribPointer(this.shadowPosAttribLoc, 4, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(this.shadowPosAttribLoc);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mengerIndexBuffer);

    this.shadowWorldUniformLocation = gl.getUniformLocation(this.shadowProgram, "mWorld") as WebGLUniformLocation;
    this.shadowViewUniformLocation = gl.getUniformLocation(this.shadowProgram, "mView") as WebGLUniformLocation;
    this.shadowProjUniformLocation = gl.getUniformLocation(this.shadowProgram, "mProj") as WebGLUniformLocation;
    this.shadowLightUniformLocation = gl.getUniformLocation(this.shadowProgram, "lightPosition") as WebGLUniformLocation;

    this.extVAO.bindVertexArrayOES(null);
  }

  public initFloor(): void {
    const gl = this.ctx;

    this.floorProgram = WebGLUtilities.createProgram(gl, floorVSText, floorFSText);
    gl.useProgram(this.floorProgram);

    this.floorVAO = this.extVAO.createVertexArrayOES() as WebGLVertexArrayObjectOES;
    this.extVAO.bindVertexArrayOES(this.floorVAO);

    const floorSize = 100.0;
    const floorY = -2.0;
    const divs = 150;
    const posArray: number[] = [];
    const indexArray: number[] = [];
    
    for (let i = 0; i <= divs; i++) {
        for (let j = 0; j <= divs; j++) {
            let x = -floorSize + (j / divs) * (floorSize * 2);
            let z = floorSize - (i / divs) * (floorSize * 2); 
            posArray.push(x, floorY, z, 1.0);
        }
    }
    
    for (let i = 0; i < divs; i++) {
        for (let j = 0; j < divs; j++) {
            let row1 = i * (divs + 1);
            let row2 = (i + 1) * (divs + 1);
            indexArray.push(row1 + j, row2 + j + 1, row1 + j + 1);
            indexArray.push(row1 + j, row2 + j, row2 + j + 1);
        }
    }
    
    const floorPositions = new Float32Array(posArray);
    const floorIndices = new Uint32Array(indexArray);
    this.floorIndexCount = floorIndices.length;

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

    this.extVAO.bindVertexArrayOES(null);
  }

  public draw(): void {
    this.sponge.updateAnimation();

    const gl: WebGLRenderingContext = this.ctx;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.frontFace(gl.CCW);

    gl.disable(gl.CULL_FACE);
    gl.depthMask(false);

    gl.useProgram(this.skyboxProgram);
    this.extVAO.bindVertexArrayOES(this.skyboxVAO);

    gl.uniformMatrix4fv(
      this.skyboxViewUniformLocation, false,
      new Float32Array(this.gui.viewMatrix().all())
    );
    gl.uniformMatrix4fv(
      this.skyboxProjUniformLocation, false,
      new Float32Array(this.gui.projMatrix().all())
    );
    gl.drawElements(gl.TRIANGLES, this.skyboxIndexCount, gl.UNSIGNED_SHORT, 0);

    gl.depthMask(true);

    gl.disable(gl.CULL_FACE);
    gl.useProgram(this.floorProgram);
    this.extVAO.bindVertexArrayOES(this.floorVAO);
    gl.uniformMatrix4fv(this.floorViewUniformLocation, false, new Float32Array(this.gui.viewMatrix().all()));
    gl.uniformMatrix4fv(this.floorProjUniformLocation, false, new Float32Array(this.gui.projMatrix().all()));
    gl.uniform4fv(this.floorLightUniformLocation, this.lightPosition.xyzw);
    gl.drawElements(gl.TRIANGLES, this.floorIndexCount, gl.UNSIGNED_INT, 0);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

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

    gl.disable(gl.CULL_FACE);
    gl.useProgram(this.shadowProgram);
    this.extVAO.bindVertexArrayOES(this.shadowVAO);
    gl.uniformMatrix4fv(this.shadowWorldUniformLocation, false, new Float32Array(modelMatrix.all()));
    gl.uniformMatrix4fv(this.shadowViewUniformLocation, false, new Float32Array(this.gui.viewMatrix().all()));
    gl.uniformMatrix4fv(this.shadowProjUniformLocation, false, new Float32Array(this.gui.projMatrix().all()));
    gl.uniform4fv(this.shadowLightUniformLocation, this.lightPosition.xyzw);
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