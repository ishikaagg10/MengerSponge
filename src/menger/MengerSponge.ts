import { Mat3, Mat4, Vec3, Vec4 } from "../lib/TSM.js";

/* A potential interface that students should implement */
interface IMengerSponge {
  setLevel(level: number): void;
  isDirty(): boolean;
  setClean(): void;
  normalsFlat(): Float32Array;
  indicesFlat(): Uint32Array;
  positionsFlat(): Float32Array;
}

/**
 * Represents a Menger Sponge
 */
export class MengerSponge implements IMengerSponge {

  private positions: number[] = [];
  private normals: number[] = [];
  private indices: number[] = [];
  private dirty: boolean = true;
  private level: number = 1;
  
  constructor(level: number) {
	  this.setLevel(level);
	  // TODO: other initialization	
  }

  /**
   * Returns true if the sponge has changed.
   */
  public isDirty(): boolean {
    return this.dirty;
  }

  public setClean(): void {
    this.dirty = false;
  }
  
  public setLevel(level: number)
  {
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
  public positionsFlat(): Float32Array {
	  return new Float32Array(this.positions);
  }

  /**
   * Returns a flat Uint32Array of the sponge's face indices
   */
  public indicesFlat(): Uint32Array {
    return new Uint32Array(this.indices);
  }

  /**
   * Returns a flat Float32Array of the sponge's normals
   */
  public normalsFlat(): Float32Array {
	  return new Float32Array(this.normals);
  }

  /**
   * Returns the model matrix of the sponge
   */
  public uMatrix(): Mat4 {

    // TODO: change this, if it's useful
    const ret : Mat4 = new Mat4().setIdentity();

    return ret;    
  }
  
  private buildMengerSponge(
      currentLevel: number,
      minX: number, minY: number, minZ: number,
      maxX: number, maxY: number, maxZ: number
  ) {
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
                  if (x === 1) centerCount++;
                  if (y === 1) centerCount++;
                  if (z === 1) centerCount++;

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

                  this.buildMengerSponge(
                      currentLevel - 1,
                      curMinX, curMinY, curMinZ,
                      curMaxX, curMaxY, curMaxZ
                  );
              }
          }
      }
  }

  private addCube(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number) {
      // helper function to add a face
      const addFace = (
          v0x: number, v0y: number, v0z: number,
          v1x: number, v1y: number, v1z: number,
          v2x: number, v2y: number, v2z: number,
          v3x: number, v3y: number, v3z: number,
          nx: number, ny: number, nz: number
      ) => {
          const startIndex = this.positions.length / 4;

          this.positions.push(
              v0x, v0y, v0z, 1.0,
              v1x, v1y, v1z, 1.0,
              v2x, v2y, v2z, 1.0,
              v3x, v3y, v3z, 1.0
          );

          this.normals.push(
              nx, ny, nz, 0.0,
              nx, ny, nz, 0.0,
              nx, ny, nz, 0.0,
              nx, ny, nz, 0.0
          );

          this.indices.push(
              startIndex, startIndex + 1, startIndex + 2,
              startIndex, startIndex + 2, startIndex + 3
          );
      };

      // Front Face (+Z)
      addFace(
          minX, minY, maxZ,
          maxX, minY, maxZ,
          maxX, maxY, maxZ,
          minX, maxY, maxZ,
          0.0, 0.0, 1.0
      );

      // Back Face (-Z)
      addFace(
          maxX, minY, minZ,
          minX, minY, minZ,
          minX, maxY, minZ,
          maxX, maxY, minZ,
          0.0, 0.0, -1.0
      );

      // Top Face (+Y)
      addFace(
          minX, maxY, maxZ,
          maxX, maxY, maxZ,
          maxX, maxY, minZ,
          minX, maxY, minZ,
          0.0, 1.0, 0.0
      );

      // Bottom Face (-Y)
      addFace(
          minX, minY, minZ,
          maxX, minY, minZ,
          maxX, minY, maxZ,
          minX, minY, maxZ,
          0.0, -1.0, 0.0
      );

      // Right Face (+X)
      addFace(
          maxX, minY, maxZ,
          maxX, minY, minZ,
          maxX, maxY, minZ,
          maxX, maxY, maxZ,
          1.0, 0.0, 0.0
      );

      // Left Face (-X)
      addFace(
          minX, minY, minZ,
          minX, minY, maxZ,
          minX, maxY, maxZ,
          minX, maxY, minZ,
          -1.0, 0.0, 0.0
      );
  }
}
