var freq = 41.;
var params;
var L = 2;
var K = 10;
var param_inner_coefficients;
var param_inner_intercepts;
var param_outer_coefficients;
var param_scalers = [
    .1, // frequency
    // sin coefficients
    .1, .1, .1, .1, .1, .1, .1, .1,
    .1, .1, .1, .1, .1, .1, .1, .1,
    .1, .1, .1,
    // noise coefficients
    .001, .001, .001, .001, .001, .001, .001,
    // colors
    .005, .005, .005, .005,
     .05 // relative weight
];
var param_offsets;
var c1_offset, c2_offset, c1, c2;
var animation_t = 0;
var n_params = 0;
var weight_offsets;

var SIDE;
var t = null;
var play = 1;


function btnPlay(val) {
    play = val;
    var btnToHideId = 'btnPlay';
    var btnToShowId = 'btnPause';
    if (val == 0) {
        btnToHideId = 'btnPause';
        btnToShowId = 'btnPlay';
    }

    document.getElementById(btnToHideId).setAttribute('hidden', true);
    document.getElementById(btnToShowId).removeAttribute('hidden');
}


function rand() {
    return 2 * (Math.random() - .5);
}

function isDark(c) {
    color = sampleColor(c[0], c[1]);
    return Math.max(...color.slice(0, 3)) < 180;
}

function dist(c1, c2) {
    return Math.sqrt(
        Math.pow(c1[0] - c2[0], 2) + Math.pow(c1[1] - c2[1], 2)
    );
}


function btnReset() {
    param_offsets = [];
    param_inner_coefficients = [];
    param_inner_intercepts = [];
    param_outer_coefficients = [];
    c1_offset = [];
    c2_offset = [];
    for (var l = 0; l < L; l++) {
        curr_param_offsets = [
            (Math.abs(rand()) + .4) * 10 * Math.sign(rand()), // frequency
            // sin coefficients
            rand() * 2.5, rand() * 2.5, rand() * 2.5, rand() * 2.5, rand() * 2.5, rand() * 2.5, rand() * 2.5, rand() * 2.5,
            rand() * 2.5, rand() * 2.5, rand() * 2.5, rand() * 2.5, rand() * 2.5, rand() * 2.5, rand() * 2.5, rand() * 2.5,
            rand() * 2.5, rand() * 2.5, rand() * 2.5,
            // noise coefficients
             rand() / 32, rand() / 26, rand() / 20, rand() / 16, rand() / 10, rand() / 5, rand() / 2
        ];

        n_params = curr_param_offsets.length;

        curr_c1_offset = [rand(), rand()];
        curr_c2_offset = [rand(), rand()];
        while ((isDark(curr_c1_offset) && isDark(curr_c2_offset)) || dist(curr_c1_offset, curr_c2_offset) < .4) {
            curr_c1_offset = [rand(), rand()];
            curr_c2_offset = [rand(), rand()];
        }

        curr_param_inner_coefficients = [];
        curr_param_inner_intercepts = [];
        curr_param_outer_coefficients = [];
        for (var i = 0; i < param_scalers.length; i++) {
            var sub_curr_inner_coefficients = [];
            var sub_curr_inner_intercepts = [];
            var sub_curr_outer_coefficients = [];
            for (var j = 0; j < K; j++) {
                sub_curr_inner_coefficients.push(rand() / 1000);
                sub_curr_inner_intercepts.push(rand() / 100);
                sub_curr_outer_coefficients.push(rand() * 25);
            }

            curr_param_inner_coefficients.push(sub_curr_inner_coefficients);
            curr_param_inner_intercepts.push(sub_curr_inner_intercepts);
            curr_param_outer_coefficients.push(sub_curr_outer_coefficients);
        }

        param_offsets.push(curr_param_offsets);
        param_inner_coefficients.push(curr_param_inner_coefficients);
        param_inner_intercepts.push(curr_param_inner_intercepts);
        param_outer_coefficients.push(curr_param_outer_coefficients);
        c1_offset.push(curr_c1_offset);
        c2_offset.push(curr_c2_offset);
    }

    weight_offsets = [Math.random(), Math.random()];
}


function btnFullscreen() {
    document.getElementsByTagName('canvas')[0].requestFullscreen().then(init_canvas(true));
}


function sigmoid(z) {
    return 1 / (1 + Math.exp(-z))
}

function relu(z) {
    if (z > 0) return z;
    return 0;
}

function sampleColor(x, y) {
    var a1 = relu(-1.2188 * x + 0.0415 * y + 1.0589);
    var a2 = relu(-1.0510 * x -0.8256 * y -0.3494);
    var a3 = relu(1.1149 * x -0.7111 * y -0.1313);
    var a4 = relu(-0.0387 * x -1.4110 * y -0.2488);

    var b1 = relu(-0.136395 * a1 + 0.575231 * a2 + -0.145008 * a3 + -1.735302 * a4 + 0.5238252282142639);
    var b2 = relu(-0.272624 * a1 + -0.358771 * a2 + 0.052946 * a3 + -0.368480 * a4 + -0.24818944931030273);
    var b3 = relu(0.134950 * a1 + 1.733816 * a2 + -0.269709 * a3 + 0.252410 * a4 + -0.7341763377189636);
    var b4 = relu(-0.234243 * a1 + 0.700139 * a2 + -0.319398 * a3 + 0.545846 * a4 + 1.2214758396148682);
    var b5 = relu(-0.564525 * a1 + 0.530353 * a2 + -1.015033 * a3 + 0.433957 * a4 + 1.0136735439300537);
    var b6 = relu(-1.000517 * a1 + 0.173901 * a2 + 0.523143 * a3 + 0.592099 * a4 + 1.4919533729553223);
    var b7 = relu(-0.551286 * a1 + 1.510706 * a2 + -0.653102 * a3 + 0.497129 * a4 + -2.2182199954986572);
    var b8 = relu(1.162767 * a1 + 0.044939 * a2 + -1.308071 * a3 + 0.960619 * a4 + -0.9014285206794739);

    var r = sigmoid(1.471640 * b1 + -0.138874 * b2 + -0.584427 * b3 + -1.334114 * b4 + -0.543559 * b5 + 2.021319 * b6 + -1.596821 * b7 + 1.868500 * b8 + -1.2098339796066284);
    var g = sigmoid(-0.389720 * b1 + -0.140179 * b2 + 0.347732 * b3 + -1.474728 * b4 + -1.075398 * b5 + 1.252836 * b6 + -1.286075 * b7 + 0.732852 * b8 + 0.02287355065345764);
    var b = sigmoid(-1.034993 * b1 + -0.048010 * b2 + 1.782444 * b3 + -1.423065 * b4 + -2.734913 * b5 + 0.601486 * b6 + -2.460198 * b7 + -0.471462 * b8 + 1.0826581716537476);

    return [r, g, b].map(x => x * 255).map(Math.round).concat([255]);
}

function draw_frame(params, weights) {
	var c = document.getElementsByTagName('canvas')[0];

	const gl = c.getContext('webgl');

	if (!gl) {
        console.log('Unable to initialize WebGL. Your browser or machine may not support it.');
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
    uniform float u_params[54];
    uniform float u_weights[2];
    uniform sampler2D u_cmap;

    // ---------------------------------------------------------------------------
    // https://stegu.github.io/webgl-noise/webdemo/
    //
    // GLSL textureless classic 2D noise "cnoise",
    // with an RSL-style periodic variant "pnoise".
    // Author:  Stefan Gustavson (stefan.gustavson@liu.se)
    // Version: 2011-08-22
    //
    // Many thanks to Ian McEwan of Ashima Arts for the
    // ideas for permutation and gradient selection.
    //
    // Copyright (c) 2011 Stefan Gustavson. All rights reserved.
    // Distributed under the MIT license. See LICENSE file.
    // https://github.com/stegu/webgl-noise

    // MIT License
    // Copyright (C) 2011 by Ashima Arts (Simplex noise)
    // Copyright (C) 2011-2016 by Stefan Gustavson (Classic noise and others)
    //
    // Permission is hereby granted, free of charge, to any person obtaining a copy
    // of this software and associated documentation files (the "Software"), to deal
    // in the Software without restriction, including without limitation the rights
    // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    // copies of the Software, and to permit persons to whom the Software is
    // furnished to do so, subject to the following conditions:
    //
    // The above copyright notice and this permission notice shall be included in
    // all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    // THE SOFTWARE.

    vec4 mod289(vec4 x)
    {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 permute(vec4 x)
    {
      return mod289(((x*34.0)+10.0)*x);
    }

    vec4 taylorInvSqrt(vec4 r)
    {
      return 1.79284291400159 - 0.85373472095314 * r;
    }

    vec2 fade(vec2 t) {
      return t*t*t*(t*(t*6.0-15.0)+10.0);
    }

    float cnoise(vec2 P)
    {
      vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
      vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
      Pi = mod289(Pi); // To avoid truncation effects in permutation
      vec4 ix = Pi.xzxz;
      vec4 iy = Pi.yyww;
      vec4 fx = Pf.xzxz;
      vec4 fy = Pf.yyww;

      vec4 i = permute(permute(ix) + iy);

      vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0 ;
      vec4 gy = abs(gx) - 0.5 ;
      vec4 tx = floor(gx + 0.5);
      gx = gx - tx;

      vec2 g00 = vec2(gx.x,gy.x);
      vec2 g10 = vec2(gx.y,gy.y);
      vec2 g01 = vec2(gx.z,gy.z);
      vec2 g11 = vec2(gx.w,gy.w);

      vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
      g00 *= norm.x;
      g01 *= norm.y;
      g10 *= norm.z;
      g11 *= norm.w;

      float n00 = dot(g00, vec2(fx.x, fy.x));
      float n10 = dot(g10, vec2(fx.y, fy.y));
      float n01 = dot(g01, vec2(fx.z, fy.z));
      float n11 = dot(g11, vec2(fx.w, fy.w));

      vec2 fade_xy = fade(Pf.xy);
      vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
      float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
      return 2.3 * n_xy;
    }

    // ---------------------------------------------------------------------------


    void main(void) {
      vec2 position = gl_FragCoord.xy / u_resolution;

      float x = 2. * position[0] - 1.;
      float y = 2. * position[1] - 1.;
      float x2 = x * x;
      float y2 = y * y;
      float xy = x * y;
      float x2y = x2 * y;
      float xy2 = x * y2;
      float x3 = x2 * x;
      float y3 = y2 * y;
      float x3y = x3 * y;
      float xy3 = y3 * x;
      float x2y2 = x2 * y2;
      float x4 = x3 * x;
      float y4 = y3 * y;
      float x4y = x4 * y;
      float xy4 = y4 * x;
      float x3y2 = x3 * y2;
      float x2y3 = x2 * y3;
      float x5 = x4 * x;
      float y5 = y4 * y;

    float val0 = sin(u_params[0] * (
        u_params[1] * x +
        u_params[2] * y +
        u_params[3] * x2 +
        u_params[4] * xy +
        u_params[5] * x2y +
        u_params[6] * xy2 +
        u_params[7] * x3 +
        u_params[8] * y3 +
        u_params[9] * x3y +
        u_params[10] * xy3 +
        u_params[11] * x2y2 +
        u_params[12] * x4 +
        u_params[13] * y4 +
        u_params[14] * x4y +
        u_params[15] * xy4 +
        u_params[16] * x3y2 +
        u_params[17] * x2y3 +
        u_params[18] * x5 +
        u_params[19] * y5 +
        u_params[20] * cnoise(192. * position) +
        u_params[21] * cnoise(96. * position) +
        u_params[22] * cnoise(48. * position) +
        u_params[23] * cnoise(24. * position) +
        u_params[24] * cnoise(12. * position) +
        u_params[25] * cnoise(6. * position) +
        u_params[26] * cnoise(3. * position)
      ));

       val0 = (val0 + 1.) / 2.;

       float val1 = sin(u_params[27 + 0] * (
        u_params[1] * x +
        u_params[2] * y +
        u_params[3] * x2 +
        u_params[4] * xy +
        u_params[5] * x2y +
        u_params[6] * xy2 +
        u_params[7] * x3 +
        u_params[8] * y3 +
        u_params[9] * x3y +
        u_params[10] * xy3 +
        u_params[11] * x2y2 +
        u_params[12] * x4 +
        u_params[13] * y4 +
        u_params[14] * x4y +
        u_params[15] * xy4 +
        u_params[16] * x3y2 +
        u_params[17] * x2y3 +
        u_params[18] * x5 +
        u_params[19] * y5 +
        u_params[20] * cnoise(192. * position) +
        u_params[21] * cnoise(96. * position) +
        u_params[22] * cnoise(48. * position) +
        u_params[23] * cnoise(24. * position) +
        u_params[24] * cnoise(12. * position) +
        u_params[25] * cnoise(6. * position) +
        u_params[26] * cnoise(3. * position)
      ));

      val1 = (val1 + 1.) / 2.;

      gl_FragColor = (u_weights[0] * texture2D(u_cmap, vec2(val0 + .0025, .25))
                      + u_weights[1] * texture2D(u_cmap, vec2(val1 + .0025, .75))
      );
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
      params: gl.getUniformLocation(shaderProgram, 'u_params'),
      weights: gl.getUniformLocation(shaderProgram, 'u_weights'),
      cmap: gl.getUniformLocation(shaderProgram, 'u_cmap')
    },
  };

	const buffers = initBuffers(gl);

	drawScene(gl, programInfo, buffers, params, weights);
}

function initBuffers(gl) {
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	var positions = [
         1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
        -1.0, -1.0,
    ];

    /* if (document.fullscreenElement != null) {
        positions = [
             2.0,  8.0,
            -2.0,  8.0,
             2.0, -2.0,
            -2.0, -2.0,
        ];
    } */

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

function drawScene(gl, programInfo, buffers, params, weights) {
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
                   Math.min(aspect, 1 / aspect),
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

	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

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

  gl.uniform1fv(programInfo.uniformLocations.params, params);
  gl.uniform1fv(programInfo.uniformLocations.weights, weights);
  gl.uniform1i(programInfo.uniformLocations.cmap, 0);

  var palette = makeCmap();
  gl.activeTexture(gl.TEXTURE0);
  var paletteTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, paletteTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 200, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, palette);
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
    throw new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

	return shaderProgram;
}

function loadShader(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
	}

	return shader;
}

function makeCmap() {
    return new Uint8Array(
        makeCmapTexture(sampleColor(...c1[0]), sampleColor(...c2[0]))
        .concat(makeCmapTexture(sampleColor(...c1[1]), sampleColor(...c2[1])))
    );
}

function makeCmapTexture(c1, c2) {
    result = [];
    for (var i = 0; i <= 1; i += 1/200) {
        var r = c1[0] + i * (c2[0] - c1[0]);
        var g = c1[1] + i * (c2[1] - c1[1]);
        var b = c1[2] + i * (c2[2] - c1[2]);
        var a = c1[3] + i * (c2[3] - c1[3]);
        result = result.concat([r, g, b, a]);
    }

    return result;
}

function init_canvas(fullscreen) {
	var c = document.getElementsByTagName('canvas')[0];
	if (!fullscreen) {
        SIDE = 600;
        if (window.innerWidth < 900) {
            SIDE = 250;
        }

        c.width = SIDE;
        c.height = SIDE;
	} else {
	    c.height = window.innerHeight;
        c.width = window.innerWidth;
	}

	c.addEventListener('webglcontextlost', function(event) {
	    event.preventDefault();
	}, false);
}

function animate(new_t) {
    var dt = 0;
    if (t != null) {
        dt = new_t - t;
    }

    dt *= play;

    t = new_t;
    animation_t += dt;

    params = [];
    c1 = [];
    c2 = [];
    weight_bases = [];
    weight_softmax_sum = 0;
    for (var l = 0; l < L; l++) {
        curr_params = [];
        for (var i = 0; i < n_params; i++) {
            curr_params.push(param_offsets[l][i] + resolve_modifications(
                param_inner_coefficients[l][i], param_inner_intercepts[l][i],
                param_outer_coefficients[l][i], param_scalers[i]
            ));
        }

        params = params.concat(curr_params);

        curr_c1 = [c1_offset[l][0] + resolve_modifications(
                param_inner_coefficients[l][27], param_inner_intercepts[l][27],
                param_outer_coefficients[l][27], param_scalers[27]
                ),
              c1_offset[l][1] + resolve_modifications(
                param_inner_coefficients[l][28], param_inner_intercepts[l][28],
                param_outer_coefficients[l][28], param_scalers[28]
                )];
        curr_c2 = [c2_offset[l][0] + resolve_modifications(
                param_inner_coefficients[l][29], param_inner_intercepts[l][29],
                param_outer_coefficients[l][29], param_scalers[29]
                ),
              c2_offset[l][1] + resolve_modifications(
                param_inner_coefficients[l][30], param_inner_intercepts[l][30],
                param_outer_coefficients[l][30], param_scalers[30]
                )];

        c1.push(curr_c1);
        c2.push(curr_c2);

        curr_weight = weight_offsets[l] + resolve_modifications(
                param_inner_coefficients[l][31], param_inner_intercepts[l][31],
                param_outer_coefficients[l][31], param_scalers[31]
                );

        weight_bases.push(curr_weight);
        weight_softmax_sum += sigmoid(curr_weight);
    }

    weights = [];
    for (var i = 0; i < L; i++) {
        weights.push(sigmoid(weight_bases[i]) / weight_softmax_sum);
    }

    try {
        draw_frame(params, weights);
    } catch (error) { }

    requestAnimationFrame(animate);
}

function resolve_modifications(inner_coefficients, inner_intercepts, outer_coefficients, scaler) {
    res = 0;
    for (var i = 0; i < K; i++) {
        res += outer_coefficients[i] * Math.sin(inner_coefficients[i] * animation_t + inner_intercepts[i]);
    }

    return res * scaler;
}

window.onload = function() {
    document.addEventListener('fullscreenchange', function(e) {
        if (document.fullscreenElement == null) {
            init_canvas();
        }
    }, false);

	init_canvas();
	btnReset();
	btnPlay(0);
	requestAnimationFrame(animate);
}
