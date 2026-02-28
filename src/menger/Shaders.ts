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

    uniform vec4 lightPosition;
    uniform mat4 mView;
    uniform mat4 mProj;

    void main () {
        uv = vertPosition.xz;
        gl_Position = mProj * mView * vertPosition;
        lightDir = lightPosition - vertPosition;
    }
`;

export let floorFSText = `
    precision mediump float;

    varying vec2 uv;
    varying vec4 lightDir;

    void main () {
        float size = 5.0;
        float cx = floor(uv.x / size);
        float cz = floor(uv.y / size);
        float checker = mod(cx + cz, 2.0);
        vec3 baseColor = checker < 1.0 ? vec3(0.0, 0.0, 0.0) : vec3(1.0, 1.0, 1.0);
        
        vec3 normal = vec3(0.0, 1.0, 0.0);
        vec3 l = normalize(lightDir.xyz);
        float diffuse = max(dot(normal, l), 0.0);
        
        gl_FragColor = vec4(baseColor * diffuse, 1.0);
    }
`;