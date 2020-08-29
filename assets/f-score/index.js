var BETA = 1., BANDS = 15;
var SIDE, RES;


function on_input_change(self) {
	if (self.id == "bands") {
		BANDS = self.value;
	} else {
		BETA = 10**self.value;
	}

	draw_F_score(BETA, BANDS);
}

function draw_F_score(beta, bands) {
	document.getElementById('bands_value').innerHTML = bands.toString().padStart(3, ' ').replace(/\s/g, '&nbsp;');
	document.getElementById('beta_value').innerHTML = beta.toFixed(2).padStart(6, ' ').replace(/\s/g, '&nbsp;');

	var X = 50, Y = 50, W = SIDE - 100, H = SIDE - 100;
	var c = document.getElementsByTagName('canvas')[0];

	const gl = c.getContext('webgl');

	if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

	const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;

	const fsSource = `
    #ifdef GL_ES
    precision mediump float;
    #endif

    uniform vec2 u_resolution;
    uniform float u_beta;
    uniform float u_bands;
    uniform sampler2D u_cmap;


    float circleshape(vec2 position, float radius) {
      return step(radius, length(position - vec2(0.5)));
    }

    void main(void) {
      vec2 position = gl_FragCoord.xy / u_resolution;
      float beta = u_beta;
      float bands = u_bands;

      float score = (1. + beta * beta) *
          (position[0] * position[1]) / (beta * beta * position[0] + position[1]);
      score = floor(score * bands) / bands;
      gl_FragColor = texture2D(u_cmap, vec2(score + .005, .5));
    }
  `;

	const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

	const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor')
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      resolution: gl.getUniformLocation(shaderProgram, 'u_resolution'),
      beta: gl.getUniformLocation(shaderProgram, 'u_beta'),
      bands: gl.getUniformLocation(shaderProgram, 'u_bands'),
      cmap: gl.getUniformLocation(shaderProgram, 'u_cmap')
    },
  };

	const buffers = initBuffers(gl);

	drawScene(gl, programInfo, buffers, beta, bands);
}

function initBuffers(gl) {
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	const positions = [
     1.0,  1.0,
    -1.0,  1.0,
     1.0, -1.0,
    -1.0, -1.0,
  ];

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	var colors = [
    1.0,  1.0,  1.0,  1.0,    // white
    1.0,  0.0,  0.0,  1.0,    // red
    0.0,  1.0,  0.0,  1.0,    // green
    0.0,  0.0,  1.0,  1.0,    // blue
  ];

	const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    color: colorBuffer,
  };
}

function drawScene(gl, programInfo, buffers, beta, bands) {
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	const fieldOfView = 45 * Math.PI / 180;
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();
	mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

	const modelViewMatrix = mat4.create();

	mat4.translate(modelViewMatrix,
                 modelViewMatrix,
                 [-0.0, 0.0, -2.425]);

	{
		const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
	}

	{
		const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexColor);
	}

	gl.useProgram(programInfo.program);

	gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

  gl.uniform2f(programInfo.uniformLocations.resolution,
               gl.canvas.clientWidth, gl.canvas.clientHeight);

  gl.uniform1f(programInfo.uniformLocations.beta, beta);
  gl.uniform1f(programInfo.uniformLocations.bands, bands);
  gl.uniform1i(programInfo.uniformLocations.cmap, 0);

  var palette = makeCmap();
  gl.activeTexture(gl.TEXTURE0);
  var paletteTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, paletteTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 100, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, palette);

	{
		const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
	}
}

function initShaderProgram(gl, vsSource, fsSource) {
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

	const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

	return shaderProgram;
}

function loadShader(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
	}

	return shader;
}

function makeCmap() {
  return new Uint8Array([ 68,   1,  84, 255,  68,   3,  87, 255,  69,   8,  91, 255,  70,
        11,  94, 255,  71,  15,  98, 255,  71,  18, 101, 255,  71,  22,
       105, 255,  72,  26, 108, 255,  72,  29, 111, 255,  72,  33, 114,
       255,  72,  35, 116, 255,  71,  39, 119, 255,  71,  43, 122, 255,
        70,  45, 124, 255,  70,  49, 126, 255,  69,  52, 127, 255,  68,
        55, 129, 255,  67,  58, 131, 255,  66,  61, 132, 255,  65,  65,
       134, 255,  64,  67, 135, 255,  63,  71, 136, 255,  62,  73, 137,
       255,  61,  76, 137, 255,  59,  80, 138, 255,  58,  82, 139, 255,
        57,  85, 139, 255,  56,  87, 140, 255,  54,  90, 140, 255,  53,
        92, 140, 255,  52,  95, 141, 255,  50,  98, 141, 255,  49, 100,
       141, 255,  48, 103, 141, 255,  47, 105, 141, 255,  46, 108, 142,
       255,  45, 111, 142, 255,  44, 113, 142, 255,  43, 116, 142, 255,
        42, 118, 142, 255,  41, 121, 142, 255,  40, 123, 142, 255,  39,
       125, 142, 255,  38, 128, 142, 255,  37, 130, 142, 255,  36, 133,
       141, 255,  35, 135, 141, 255,  34, 137, 141, 255,  33, 140, 141,
       255,  33, 142, 140, 255,  32, 145, 140, 255,  31, 147, 139, 255,
        31, 150, 139, 255,  30, 153, 138, 255,  30, 154, 137, 255,  30,
       157, 136, 255,  30, 159, 136, 255,  31, 162, 134, 255,  32, 164,
       133, 255,  33, 167, 132, 255,  35, 169, 130, 255,  37, 171, 129,
       255,  40, 174, 127, 255,  42, 176, 126, 255,  46, 178, 124, 255,
        50, 181, 122, 255,  53, 183, 120, 255,  57, 185, 118, 255,  61,
       187, 116, 255,  66, 190, 113, 255,  71, 192, 110, 255,  75, 194,
       108, 255,  81, 196, 104, 255,  85, 198, 102, 255,  91, 200,  98,
       255,  96, 201,  96, 255, 103, 204,  92, 255, 109, 206,  88, 255,
       114, 207,  85, 255, 121, 209,  81, 255, 126, 210,  78, 255, 134,
       212,  73, 255, 141, 214,  68, 255, 146, 215,  65, 255, 154, 216,
        60, 255, 159, 217,  56, 255, 167, 219,  51, 255, 173, 220,  48,
       255, 181, 221,  43, 255, 189, 222,  38, 255, 194, 223,  34, 255,
       202, 224,  30, 255, 207, 225,  28, 255, 215, 226,  25, 255, 223,
       227,  24, 255, 228, 227,  24, 255, 236, 228,  26, 255, 241, 229,
        28, 255, 248, 230,  33, 255, 253, 231,  36, 255]);
}

function set_canvas_size() {
	var c = document.getElementsByTagName('canvas')[0];
	SIDE = 600;
	RES = 5;
	if (window.innerWidth < 900) {
		SIDE = 250;
		RES = 1;
	}

	c.width = SIDE;
	c.height = SIDE;
}

window.onload = function() {
	set_canvas_size();
	draw_F_score(BETA, BANDS);
}
