function drawStar(ctx, x, y, s, r, a) {
  ctx.fillStyle = 'rgba(224, 224, 224,' + a + ')';
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.rotate(r);
  ctx.beginPath();
  ctx.moveTo(-1, -1);
  ctx.lineTo(0, -5);
  ctx.lineTo(1, -1);
  ctx.lineTo(5, 0);
  ctx.lineTo(1, 1);
  ctx.lineTo(0, 5);
  ctx.lineTo(-1, 1);
  ctx.lineTo(-5, 0);

  ctx.closePath();
  ctx.fill();

  ctx.resetTransform();
}

function drawStars(ctx, n, W, H) {
  for (var i = 0; i < n; i++) {
    var x = Math.random() * W;
    var y = Math.random() * H;
    var r = Math.random() * Math.PI / 2;
    var s = 1 / (10 - 9 * Math.random());
    var a = 0.5 * (0.4 + Math.random());
    drawStar(ctx, x, y, s, r, a);
  }
}

function drawMoon(ctx, x, y, alpha) {
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  var R = 30;

  ctx.fillStyle = '#171723';
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, 2 * Math.PI, false);
  ctx.fill();

  var color = '#EEEEEE';
  r = Math.random();
  if (r < .33) {
    color = '#EEEEA5';
  } else if (r < .66) {
    color = '#A5A5EE';
  }

  function drawMoonShape() {
    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.moveTo(0, R);
    for (var deg = R; deg >= -R; deg -= 0.01) {
      ctx.lineTo(Math.sqrt(R * R - deg * deg) * Math.sin(alpha), deg);
    }

    for (var deg = -R; deg <= R; deg += 0.01) {
      ctx.lineTo(Math.sqrt(R * R - deg * deg), deg);
    }

    ctx.fill();
  }

  ctx.filter = "blur(50px)";
  drawMoonShape();

  ctx.filter = "blur(20px)";
  drawMoonShape();

  ctx.filter = "blur(5px)";
  drawMoonShape();

  ctx.filter = "none";
  drawMoonShape();

  ctx.resetTransform();
}

function genPerlin(f, m) {
  var n = [];
  for (var i = 0; i < f; i++) {
    n.push(2 * Math.random() - 1);
  }

  n.push(n[f - 1]);

  var curr_x = 0, curr_y = 0, y = [];
  var dx = (n.length - 1) / m;

  for (var j = 0; j < m; j++) {
    var lo = Math.floor(curr_x);
    var hi = lo + 1;
    var dist = curr_x - lo;
    var loSlope = n[lo];
    var hiSlope = n[hi];

    var loPos = loSlope * dist;
    var hiPos = -hiSlope * (1 - dist);
    var u = dist * dist * (3 - 2 * dist);

    curr_y = loPos * (1 - u) + hiPos * u;

    y.push(curr_y);
    curr_x += dx;
  }

  return y;
}

function genCloud() {
  var R = 50;
  var N = 500;
  var x = [], y = [];

  var noise_layer1 = genPerlin(10, N).map(x => 35 * x);
  var noise_layer2 = genPerlin(20, N).map(x => 10 * x);

  var dt = 2 * Math.PI / N;
  for (var i = 0; i < N; i += 1) {
    var t = i * dt;

    var curr_x = (R + noise_layer1[i] + noise_layer2[i]) * Math.cos(t);
    var curr_y = (R + noise_layer1[i] + noise_layer2[i]) * Math.sin(t);

    x.push(curr_x);
    y.push(curr_y);
  }

  x.push(x[0]);
  y.push(y[0]);

  return [x, y];
}

function drawCloud(ctx, cx, cy, a) {
  var [x, y] = genCloud();

  var x_scale = .5 + Math.random() * 5;
  var y_scale = .5 + Math.random() * 5;

  ctx.translate(cx, cy);
  ctx.rotate(Math.PI * Math.random());

  ctx.filter = "blur(5px)";

  ctx.fillStyle = 'rgba(224, 224, 224,' + a + ')';

  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (var i = 0; i < y.length; i++) {
    ctx.lineTo(x_scale * x[i], y_scale * y[i]);
  }

  ctx.closePath();

  ctx.fill();

  ctx.filter = "none";
  ctx.resetTransform();
}

function drawClouds(ctx, W, H) {
  for (var i = 0; i < Math.random() * 4; i++) {
    drawCloud(ctx, W * Math.random(), H * Math.random(), .1 + .4 * Math.random());
  }
}

function redraw() {
  var canvas = document.getElementsByTagName('canvas')[0];
  var H = canvas.scrollHeight;
  var W = canvas.scrollWidth;

  canvas.height = H;
  canvas.width = W;
  var ctx = canvas.getContext("2d");

  drawStars(ctx, 4096, W, H);
  drawMoon(ctx, 50 + (W - 100) * Math.random(), 50 + (H - 100) * Math.random(), Math.PI * (Math.random() - .5));

  drawClouds(ctx, W, H);
}

window.onload = function() {
  redraw();

  document.getElementById('fullscreen').onclick = function() {
    if (document.fullscreenElement) {
      document.exitFullscreen().then(redraw);
    } else {
      document.getElementById('night-container').requestFullscreen().then(redraw);
    }
  };

  document.getElementById('repaint').onclick = redraw;
};
