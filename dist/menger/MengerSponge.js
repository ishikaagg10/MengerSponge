import { Mat4, Vec3 } from "../lib/TSM.js";
/**
 * Represents a Menger Sponge
 */
export class MengerSponge {
    addSpin(axis, speed) {
        this.spinAxis = axis;
        this.spinSpeed = speed;
        if (this.spinSpeed > 0 && !Number.isNaN(this.spinAxis.x)) {
            this.currentRotation.rotate(this.spinSpeed, this.spinAxis);
        }
    }
    updateAnimation() {
        if (this.spinSpeed > 0.0001 && !Number.isNaN(this.spinAxis.x)) {
            this.currentRotation.rotate(this.spinSpeed, this.spinAxis);
            this.spinSpeed *= 0.93;
        }
        else {
            this.spinSpeed = 0.0;
        }
    }
    constructor(level) {
        this.positions = [];
        this.normals = [];
        this.currentRotation = new Mat4().setIdentity();
        this.spinAxis = new Vec3([0, 1, 0]);
        this.spinSpeed = 0.0;
        this.indices = [];
        this.dirty = true;
        this.level = 1;
        this.setLevel(level);
        // TODO: other initialization	
    }
    /**
     * Returns true if the sponge has changed.
     */
    isDirty() {
        return this.dirty;
    }
    setClean() {
        this.dirty = false;
    }
    setLevel(level) {
        this.level = level;
        this.positions = [];
        this.normals = [];
        this.indices = [];
        const m = -0.5;
        const M = 0.5;
        this.buildMengerSponge(this.level, m, m, m, M, M, M);
        this.dirty = true;
    }
    /* Returns a flat Float32Array of the sponge's vertex positions */
    positionsFlat() {
        return new Float32Array(this.positions);
    }
    /**
     * Returns a flat Uint32Array of the sponge's face indices
     */
    indicesFlat() {
        return new Uint32Array(this.indices);
    }
    /**
     * Returns a flat Float32Array of the sponge's normals
     */
    normalsFlat() {
        return new Float32Array(this.normals);
    }
    /**
     * Returns the model matrix of the sponge
     */
    uMatrix() {
        return this.currentRotation.copy();
    }
    buildMengerSponge(currentLevel, minX, minY, minZ, maxX, maxY, maxZ) {
        if (currentLevel === 1) {
            this.addCube(minX, minY, minZ, maxX, maxY, maxZ);
            return;
        }
        const stepX = (maxX - minX) / 3.0;
        const stepY = (maxY - minY) / 3.0;
        const stepZ = (maxZ - minZ) / 3.0;
        for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 3; y++) {
                for (let z = 0; z < 3; z++) {
                    let centerCount = 0;
                    if (x === 1)
                        centerCount++;
                    if (y === 1)
                        centerCount++;
                    if (z === 1)
                        centerCount++;
                    // Skip the 7 inner subcubes
                    if (centerCount >= 2) {
                        continue;
                    }
                    const curMinX = minX + x * stepX;
                    const curMaxX = minX + (x + 1) * stepX;
                    const curMinY = minY + y * stepY;
                    const curMaxY = minY + (y + 1) * stepY;
                    const curMinZ = minZ + z * stepZ;
                    const curMaxZ = minZ + (z + 1) * stepZ;
                    this.buildMengerSponge(currentLevel - 1, curMinX, curMinY, curMinZ, curMaxX, curMaxY, curMaxZ);
                }
            }
        }
    }
    addCube(minX, minY, minZ, maxX, maxY, maxZ) {
        // helper function to add a face
        const addFace = (v0x, v0y, v0z, v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z, nx, ny, nz) => {
            const startIndex = this.positions.length / 4;
            this.positions.push(v0x, v0y, v0z, 1.0, v1x, v1y, v1z, 1.0, v2x, v2y, v2z, 1.0, v3x, v3y, v3z, 1.0);
            this.normals.push(nx, ny, nz, 0.0, nx, ny, nz, 0.0, nx, ny, nz, 0.0, nx, ny, nz, 0.0);
            this.indices.push(startIndex, startIndex + 1, startIndex + 2, startIndex, startIndex + 2, startIndex + 3);
        };
        // Front Face (+Z)
        addFace(minX, minY, maxZ, maxX, minY, maxZ, maxX, maxY, maxZ, minX, maxY, maxZ, 0.0, 0.0, 1.0);
        // Back Face (-Z)
        addFace(maxX, minY, minZ, minX, minY, minZ, minX, maxY, minZ, maxX, maxY, minZ, 0.0, 0.0, -1.0);
        // Top Face (+Y)
        addFace(minX, maxY, maxZ, maxX, maxY, maxZ, maxX, maxY, minZ, minX, maxY, minZ, 0.0, 1.0, 0.0);
        // Bottom Face (-Y)
        addFace(minX, minY, minZ, maxX, minY, minZ, maxX, minY, maxZ, minX, minY, maxZ, 0.0, -1.0, 0.0);
        // Right Face (+X)
        addFace(maxX, minY, maxZ, maxX, minY, minZ, maxX, maxY, minZ, maxX, maxY, maxZ, 1.0, 0.0, 0.0);
        // Left Face (-X)
        addFace(minX, minY, minZ, minX, minY, maxZ, minX, maxY, maxZ, minX, maxY, minZ, -1.0, 0.0, 0.0);
    }
}
//# sourceMappingURL=MengerSponge.js.map