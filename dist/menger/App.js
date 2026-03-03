import { CanvasAnimation, WebGLUtilities } from "../lib/webglutils/CanvasAnimation.js";
import { GUI } from "./Gui.js";
import { MengerSponge } from "./MengerSponge.js";
import { mengerTests } from "./tests/MengerTests.js";
import { defaultFSText, defaultVSText, floorFSText, floorVSText, shadowVSText, shadowFSText, skyboxVSText, skyboxFSText } from "./Shaders.js";
import { Mat4, Vec4 } from "../lib/TSM.js";
export class MengerAnimation extends CanvasAnimation {
    constructor(canvas) {
        super(canvas);
        /* The Menger sponge */
        this.sponge = new MengerSponge(1);
        /* Menger Sponge Rendering Info */
        this.mengerVAO = -1;
        this.mengerProgram = -1;
        /* Menger Buffers */
        this.mengerPosBuffer = -1;
        this.mengerIndexBuffer = -1;
        this.mengerNormBuffer = -1;
        /* Menger Attribute Locations */
        this.mengerPosAttribLoc = -1;
        this.mengerNormAttribLoc = -1;
        /* Menger Uniform Locations */
        this.mengerWorldUniformLocation = -1;
        this.mengerViewUniformLocation = -1;
        this.mengerProjUniformLocation = -1;
        this.mengerLightUniformLocation = -1;
        /* Global Rendering Info */
        this.lightPosition = new Vec4();
        this.backgroundColor = new Vec4();
        /* Floor Rendering Info */
        this.floorVAO = -1;
        this.floorProgram = -1;
        this.floorPosBuffer = -1;
        this.floorIndexBuffer = -1;
        this.floorPosAttribLoc = -1;
        this.floorViewUniformLocation = -1;
        this.floorProjUniformLocation = -1;
        this.floorLightUniformLocation = -1;
        this.floorIndexCount = 0;
        /* Shadow Rendering Info */
        this.shadowVAO = -1;
        this.shadowProgram = -1;
        this.shadowPosAttribLoc = -1;
        this.shadowWorldUniformLocation = -1;
        this.shadowViewUniformLocation = -1;
        this.shadowProjUniformLocation = -1;
        this.shadowLightUniformLocation = -1;
        /* Skybox Rendering Info */
        this.skyboxVAO = -1;
        this.skyboxProgram = -1;
        this.skyboxPosBuffer = -1;
        this.skyboxIndexBuffer = -1;
        this.skyboxPosAttribLoc = -1;
        this.skyboxViewUniformLocation = -1;
        this.skyboxProjUniformLocation = -1;
        this.skyboxIndexCount = 0;
        this.gui = new GUI(canvas, this, this.sponge);
        this.reset();
    }
    reset() {
        this.lightPosition = new Vec4([-10.0, 10.0, -10.0, 1.0]);
        /* Black clear — skybox covers the entire background each frame */
        this.backgroundColor = new Vec4([0.0, 0.0, 0.0, 1.0]);
        this.initSkybox();
        this.initMenger();
        this.initFloor();
        this.gui.reset();
    }
    /* ------------------------------------------------------------------
       initSkybox
       Key points:
         • The VAO is created and bound FIRST, then all buffer + attrib
           calls happen inside it so the state is captured correctly.
         • We explicitly unbind the VAO at the end so subsequent inits
           don't corrupt it.
    ------------------------------------------------------------------ */
    initSkybox() {
        const gl = this.ctx;
        this.skyboxProgram = WebGLUtilities.createProgram(gl, skyboxVSText, skyboxFSText);
        gl.useProgram(this.skyboxProgram);
        this.skyboxVAO = this.extVAO.createVertexArrayOES();
        this.extVAO.bindVertexArrayOES(this.skyboxVAO);
        const S = 1.0;
        // prettier-ignore
        const positions = new Float32Array([
            -S, -S, -S, // 0
            S, -S, -S, // 1
            S, S, -S, // 2
            -S, S, -S, // 3
            -S, -S, S, // 4
            S, -S, S, // 5
            S, S, S, // 6
            -S, S, S, // 7
        ]);
        // Inside-facing winding (camera is inside the cube)
        // prettier-ignore
        const indices = new Uint16Array([
            0, 2, 1, 0, 3, 2, // -Z
            4, 5, 6, 4, 6, 7, // +Z
            0, 4, 7, 0, 7, 3, // -X
            1, 2, 6, 1, 6, 5, // +X
            0, 1, 5, 0, 5, 4, // -Y
            3, 7, 6, 3, 6, 2, // +Y
        ]);
        this.skyboxIndexCount = indices.length;
        this.skyboxPosAttribLoc = gl.getAttribLocation(this.skyboxProgram, "vertPosition");
        this.skyboxPosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.skyboxPosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        gl.vertexAttribPointer(this.skyboxPosAttribLoc, 3, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(this.skyboxPosAttribLoc);
        this.skyboxIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.skyboxIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        this.skyboxViewUniformLocation =
            gl.getUniformLocation(this.skyboxProgram, "mView");
        this.skyboxProjUniformLocation =
            gl.getUniformLocation(this.skyboxProgram, "mProj");
        this.extVAO.bindVertexArrayOES(null);
    }
    initMenger() {
        this.sponge.setLevel(1);
        const gl = this.ctx;
        this.mengerProgram = WebGLUtilities.createProgram(gl, defaultVSText, defaultFSText);
        gl.useProgram(this.mengerProgram);
        this.mengerVAO = this.extVAO.createVertexArrayOES();
        this.extVAO.bindVertexArrayOES(this.mengerVAO);
        this.mengerPosAttribLoc = gl.getAttribLocation(this.mengerProgram, "vertPosition");
        this.mengerPosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.mengerPosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.sponge.positionsFlat(), gl.STATIC_DRAW);
        gl.vertexAttribPointer(this.mengerPosAttribLoc, 4, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(this.mengerPosAttribLoc);
        this.mengerNormAttribLoc = gl.getAttribLocation(this.mengerProgram, "aNorm");
        this.mengerNormBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.mengerNormBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.sponge.normalsFlat(), gl.STATIC_DRAW);
        gl.vertexAttribPointer(this.mengerNormAttribLoc, 4, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(this.mengerNormAttribLoc);
        this.mengerIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mengerIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.sponge.indicesFlat(), gl.STATIC_DRAW);
        this.mengerWorldUniformLocation = gl.getUniformLocation(this.mengerProgram, "mWorld");
        this.mengerViewUniformLocation = gl.getUniformLocation(this.mengerProgram, "mView");
        this.mengerProjUniformLocation = gl.getUniformLocation(this.mengerProgram, "mProj");
        this.mengerLightUniformLocation = gl.getUniformLocation(this.mengerProgram, "lightPosition");
        gl.uniformMatrix4fv(this.mengerWorldUniformLocation, false, new Float32Array(this.sponge.uMatrix().all()));
        gl.uniformMatrix4fv(this.mengerViewUniformLocation, false, new Float32Array(Mat4.identity.all()));
        gl.uniformMatrix4fv(this.mengerProjUniformLocation, false, new Float32Array(Mat4.identity.all()));
        gl.uniform4fv(this.mengerLightUniformLocation, this.lightPosition.xyzw);
        this.extVAO.bindVertexArrayOES(null);
        /* Shadow reuses menger buffers */
        this.shadowProgram = WebGLUtilities.createProgram(gl, shadowVSText, shadowFSText);
        gl.useProgram(this.shadowProgram);
        this.shadowVAO = this.extVAO.createVertexArrayOES();
        this.extVAO.bindVertexArrayOES(this.shadowVAO);
        this.shadowPosAttribLoc = gl.getAttribLocation(this.shadowProgram, "vertPosition");
        gl.bindBuffer(gl.ARRAY_BUFFER, this.mengerPosBuffer);
        gl.vertexAttribPointer(this.shadowPosAttribLoc, 4, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(this.shadowPosAttribLoc);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mengerIndexBuffer);
        this.shadowWorldUniformLocation = gl.getUniformLocation(this.shadowProgram, "mWorld");
        this.shadowViewUniformLocation = gl.getUniformLocation(this.shadowProgram, "mView");
        this.shadowProjUniformLocation = gl.getUniformLocation(this.shadowProgram, "mProj");
        this.shadowLightUniformLocation = gl.getUniformLocation(this.shadowProgram, "lightPosition");
        this.extVAO.bindVertexArrayOES(null);
    }
    initFloor() {
        const gl = this.ctx;
        this.floorProgram = WebGLUtilities.createProgram(gl, floorVSText, floorFSText);
        gl.useProgram(this.floorProgram);
        this.floorVAO = this.extVAO.createVertexArrayOES();
        this.extVAO.bindVertexArrayOES(this.floorVAO);
        const floorSize = 100.0;
        const floorY = -2.0;
        const divs = 150;
        const posArray = [];
        const indexArray = [];
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
        this.floorPosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.floorPosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, floorPositions, gl.STATIC_DRAW);
        gl.vertexAttribPointer(this.floorPosAttribLoc, 4, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(this.floorPosAttribLoc);
        this.floorIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.floorIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, floorIndices, gl.STATIC_DRAW);
        this.floorViewUniformLocation = gl.getUniformLocation(this.floorProgram, "mView");
        this.floorProjUniformLocation = gl.getUniformLocation(this.floorProgram, "mProj");
        this.floorLightUniformLocation = gl.getUniformLocation(this.floorProgram, "lightPosition");
        this.extVAO.bindVertexArrayOES(null);
    }
    draw() {
        this.sponge.updateAnimation();
        const gl = this.ctx;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.frontFace(gl.CCW);
        /* ----------------------------------------------------------
           PASS 1 – Skybox
           Depth writes OFF so every other pixel will overwrite it.
           depthFunc LEQUAL lets gl_Position.z == gl_Position.w
           (i.e. depth = 1.0) pass the depth test.
        ---------------------------------------------------------- */
        gl.disable(gl.CULL_FACE);
        gl.depthMask(false);
        gl.useProgram(this.skyboxProgram);
        this.extVAO.bindVertexArrayOES(this.skyboxVAO);
        gl.uniformMatrix4fv(this.skyboxViewUniformLocation, false, new Float32Array(this.gui.viewMatrix().all()));
        gl.uniformMatrix4fv(this.skyboxProjUniformLocation, false, new Float32Array(this.gui.projMatrix().all()));
        gl.drawElements(gl.TRIANGLES, this.skyboxIndexCount, gl.UNSIGNED_SHORT, 0);
        gl.depthMask(true);
        /* ----------------------------------------------------------
           PASS 2 – Floor / terrain
        ---------------------------------------------------------- */
        gl.disable(gl.CULL_FACE);
        gl.useProgram(this.floorProgram);
        this.extVAO.bindVertexArrayOES(this.floorVAO);
        gl.uniformMatrix4fv(this.floorViewUniformLocation, false, new Float32Array(this.gui.viewMatrix().all()));
        gl.uniformMatrix4fv(this.floorProjUniformLocation, false, new Float32Array(this.gui.projMatrix().all()));
        gl.uniform4fv(this.floorLightUniformLocation, this.lightPosition.xyzw);
        gl.drawElements(gl.TRIANGLES, this.floorIndexCount, gl.UNSIGNED_INT, 0);
        /* ----------------------------------------------------------
           PASS 3 – Menger sponge
        ---------------------------------------------------------- */
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
        /* ----------------------------------------------------------
           PASS 4 – Shadow
        ---------------------------------------------------------- */
        gl.disable(gl.CULL_FACE);
        gl.useProgram(this.shadowProgram);
        this.extVAO.bindVertexArrayOES(this.shadowVAO);
        gl.uniformMatrix4fv(this.shadowWorldUniformLocation, false, new Float32Array(modelMatrix.all()));
        gl.uniformMatrix4fv(this.shadowViewUniformLocation, false, new Float32Array(this.gui.viewMatrix().all()));
        gl.uniformMatrix4fv(this.shadowProjUniformLocation, false, new Float32Array(this.gui.projMatrix().all()));
        gl.uniform4fv(this.shadowLightUniformLocation, this.lightPosition.xyzw);
        gl.drawElements(gl.TRIANGLES, this.sponge.indicesFlat().length, gl.UNSIGNED_INT, 0);
    }
    setLevel(level) {
        this.sponge.setLevel(level);
    }
    getGUI() {
        return this.gui;
    }
}
export function initializeCanvas() {
    const canvas = document.getElementById("glCanvas");
    const canvasAnimation = new MengerAnimation(canvas);
    mengerTests.registerDeps(canvasAnimation);
    mengerTests.registerDeps(canvasAnimation);
    canvasAnimation.start();
}
//# sourceMappingURL=App.js.map