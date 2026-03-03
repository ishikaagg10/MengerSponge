export let defaultVSText = `
    precision mediump float;

    attribute vec4 vertPosition;
    attribute vec4 aNorm;
    
    varying vec4 lightDir;
    varying vec4 normal;   
 
    uniform vec4 lightPosition;
    uniform mat4 mWorld;
    uniform mat4 mView;
    uniform mat4 mProj;

    void main () {
        vec4 worldPos = mWorld * vertPosition;
        gl_Position = mProj * mView * worldPos;
        lightDir = lightPosition - worldPos;
        normal = aNorm;
    }
`;

export let defaultFSText = `
    precision mediump float;

    varying vec4 lightDir;
    varying vec4 normal;    

    void main () {
        vec4 n = normalize(normal);
        vec4 l = normalize(lightDir);
        float diffuse = max(dot(n, l), 0.0);
        
        vec3 absNorm = abs(n.xyz);
        vec3 baseColor;
        if (absNorm.x > absNorm.y && absNorm.x > absNorm.z) {
            baseColor = vec3(1.0, 0.0, 0.0);
        } else if (absNorm.y > absNorm.x && absNorm.y > absNorm.z) {
            baseColor = vec3(0.0, 1.0, 0.0);
        } else {
            baseColor = vec3(0.0, 0.0, 1.0);
        }
        
        gl_FragColor = vec4(baseColor * diffuse + baseColor * 0.1, 1.0);
    }
`;

export let floorVSText = `
    precision mediump float;

    attribute vec4 vertPosition;

    varying vec2 uv;
    varying vec4 lightDir;
    varying float height;
    varying vec3 vNormal;

    uniform vec4 lightPosition;
    uniform mat4 mView;
    uniform mat4 mProj;

    float hash(vec2 p) { 
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); 
    }
    
    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    
    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p = rot * p * 2.0;
            a *= 0.5;
        }
        return v;
    }

    void main () {
        uv = vertPosition.xz;
        
        float n = fbm(uv * 0.15);
        height = n * 4.0; 
        
        vec4 pos = vertPosition;
        pos.y += (height * 0.15);

        float hL = fbm((uv + vec2(-0.1, 0.0)) * 0.15) * 4.0;
        float hR = fbm((uv + vec2(0.1, 0.0)) * 0.15) * 4.0;
        float hD = fbm((uv + vec2(0.0, -0.1)) * 0.15) * 4.0;
        float hU = fbm((uv + vec2(0.0, 0.1)) * 0.15) * 4.0;
        
        vec3 norm = normalize(vec3(hL - hR, 0.2, hD - hU));
        vNormal = norm;

        gl_Position = mProj * mView * pos;
        lightDir = lightPosition - pos;
    }
`;

export let floorFSText = `
    precision mediump float;

    varying vec2 uv;
    varying vec4 lightDir;
    varying float height;
    varying vec3 vNormal;

    void main () {
        vec3 valleyColor = vec3(0.15, 0.4, 0.15);
        vec3 rockColor   = vec3(0.4, 0.35, 0.35);
        vec3 snowColor   = vec3(0.9, 0.95, 1.0);

        vec3 baseColor;
        if (height < 1.5) {
            baseColor = mix(valleyColor, rockColor, height / 1.5); 
        } else {
            baseColor = mix(rockColor, snowColor, clamp((height - 1.5) / 2.0, 0.0, 1.0));
        }

        vec3 normal  = normalize(vNormal);
        vec3 l       = normalize(lightDir.xyz);
        float diffuse = max(dot(normal, l), 0.15);
        
        gl_FragColor = vec4(baseColor * diffuse, 1.0);
    }
`;

export let shadowVSText = `
    precision mediump float;

    attribute vec4 vertPosition;

    uniform vec4 lightPosition;
    uniform mat4 mWorld;
    uniform mat4 mView;
    uniform mat4 mProj;

    void main () {
        vec4 worldPos = mWorld * vertPosition;
        vec3 L = lightPosition.xyz;
        vec3 P = worldPos.xyz;
        
        float t = (-1.99 - L.y) / (P.y - L.y);
        vec3 P_prime = L + t * (P - L);
        
        gl_Position = mProj * mView * vec4(P_prime, 1.0);
    }
`;

export let shadowFSText = `
    precision mediump float;

    void main () {
        gl_FragColor = vec4(0.1, 0.1, 0.1, 1.0);
    }
`;

/* ===================================================================
   SKYBOX SHADERS
   ===================================================================
   Strategy:
     Vertex shader  – strips translation from the view matrix so the
                      box is always centred on the camera eye.  Sets
                      gl_Position = pos.xyww so that after the
                      perspective divide z/w == 1.0, placing the box
                      exactly at the far plane.
     Fragment shader – fully procedural sky (no texture files needed):
                       blue gradient, sun disc + halo, horizon glow,
                       and a star field.
   =================================================================== */

export let skyboxVSText = `
    precision mediump float;

    attribute vec3 vertPosition;

    varying vec3 texCoords;

    uniform mat4 mView;
    uniform mat4 mProj;

    void main () {
        texCoords = vertPosition;

        /* Rebuild view matrix without translation (upper-left 3x3 only). */
        mat4 rotView = mat4(
            mView[0][0], mView[0][1], mView[0][2], 0.0,
            mView[1][0], mView[1][1], mView[1][2], 0.0,
            mView[2][0], mView[2][1], mView[2][2], 0.0,
            0.0,         0.0,         0.0,         1.0
        );

        vec4 pos = mProj * rotView * vec4(vertPosition, 1.0);

        /* Set z = w → depth = 1.0 after perspective divide (far plane). */
        gl_Position = pos.xyww;
    }
`;

export let skyboxFSText = `
    precision mediump float;

    varying vec3 texCoords;

    /* Sun direction must match the scene light: (-10, 10, -10) normalised. */
    const vec3 SUN_DIR = normalize(vec3(-10.0, 10.0, -10.0));

    float hash(vec3 p) {
        p = fract(p * vec3(443.897, 441.423, 437.195));
        p += dot(p, p.yzx + 19.19);
        return fract((p.x + p.y) * p.z);
    }

    void main () {
        vec3 dir = normalize(texCoords);

        /* --- sky gradient ------------------------------------------ */
        vec3 horizonColor = vec3(0.62, 0.78, 0.95);
        vec3 zenithColor  = vec3(0.10, 0.28, 0.72);
        vec3 groundColor  = vec3(0.28, 0.22, 0.16);

        vec3 skyColor;
        if (dir.y >= 0.0) {
            float t = clamp(dir.y, 0.0, 1.0);
            skyColor = mix(horizonColor, zenithColor, pow(t, 0.6));
        } else {
            skyColor = mix(horizonColor, groundColor, clamp(-dir.y * 3.0, 0.0, 1.0));
        }

        /* --- sun disc + halo --------------------------------------- */
        float sunDot  = dot(dir, SUN_DIR);
        float sunDisc = smoothstep(0.9995, 0.9999, sunDot);
        float sunHalo = pow(clamp(sunDot, 0.0, 1.0), 32.0) * 0.4;
        vec3  sunColor = vec3(1.0, 0.95, 0.7);

        skyColor += sunColor * sunHalo;
        skyColor  = mix(skyColor, vec3(1.0, 1.0, 0.9), sunDisc);

        /* --- horizon glow ----------------------------------------- */
        float horizonGlow = pow(1.0 - abs(dir.y), 6.0) * 0.25;
        skyColor += vec3(0.8, 0.5, 0.2) * horizonGlow * step(0.0, dir.y);

        /* --- star field (upper hemisphere, away from sun) ---------- */
        if (dir.y > 0.0 && sunDot < 0.98) {
            vec3  gridDir    = floor(dir * 80.0) / 80.0;
            float star       = hash(gridDir);
            float brightness = smoothstep(0.992, 1.0, star);
            float fade       = smoothstep(0.0, 0.15, dir.y)
                             * smoothstep(0.98, 0.92, sunDot);
            skyColor += vec3(1.0) * brightness * fade * 0.9;
        }

        gl_FragColor = vec4(skyColor, 1.0);
    }
`;