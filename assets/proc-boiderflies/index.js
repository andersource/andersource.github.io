var rng = null;
var dt = Math.PI / 5000;
var animation_frame_id = null;

function perlin_noise(f, m) {
  var n = [];
  for (var i = 0; i < f; i++) {
    n.push(2 * randrange(0, 1) - 1);
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

  return nj.array(y);
}

function gen_noise(n) {
  return perlin_noise(8, n).multiply(.08).add(perlin_noise(32, n).multiply(.02));
}

function randrange(lower, upper) {
  return rng() * (upper - lower) + lower;
}

function gen_upper_part(settings) {
  var t = nj.arange(Math.PI * 1.5, Math.PI * 2.5, dt);
  var x = nj.cos(t).multiply(settings.stretch_factor);
  var y = nj.sin(t.multiply(2)).divide(2.5);

  var z = nj.sqrt(x.subtract(.93).pow(2).add(y.subtract(.75).pow(2))).subtract(1).multiply(-1);
  z = z.subtract(z.min()).divide(z.max() - z.min()).pow(randrange(.5, 10)).multiply(randrange(.3, 1));

  var s = randrange(.4, .7);

  x = x.add(z.multiply(s));
  y = y.add(z.multiply(.5 * s));

  var noise = gen_noise(x.shape[0]);
  var y_grad_perp = x.subtract(roll2(x));
  var x_grad_perp = y.subtract(roll2(y)).multiply(-1);
  var norms = nj.sqrt(x_grad_perp.pow(2).add(y_grad_perp.pow(2)));
  x_grad_perp = x_grad_perp.divide(norms);
  y_grad_perp = y_grad_perp.divide(norms);

  x = x.add(noise.multiply(x_grad_perp));
  y = y.add(noise.multiply(y_grad_perp));

  temp = theta_deformation(x, y, 60);
  x = temp[0];
  y = temp[1];

  x = x.subtract(x.get(0));
  y = y.subtract(y.get(0));

  var v = nj.stack([x, y]).T.tolist().map(p => new THREE.Vector2(...p));
  return new THREE.ShapeGeometry(new THREE.Shape(v));
}

function roll2(a) {
  return nj.concatenate([a.slice(2), a.slice([0, 2])]);
}

function gen_lower_part(settings) {
  var t = nj.arange(Math.PI * 1.5, Math.PI * 2.5, dt);
  var x = nj.cos(t).multiply(settings.stretch_factor).
        multiply(settings.lower_scale);
  var y = nj.sin(t.multiply(2)).divide(2.5).multiply(settings.lower_scale);

  var noise = gen_noise(x.shape[0]);
  var x_grad_perp = nj.cos(t.multiply(2));
  var y_grad_perp = nj.sin(t);
  var norms = nj.sqrt(x_grad_perp.pow(2).add(y_grad_perp.pow(2)));
  x_grad_perp = x_grad_perp.divide(norms.pow(2));
  y_grad_perp = y_grad_perp.divide(norms.pow(2));

  x = x.add(noise.multiply(x_grad_perp));
  y = y.add(noise.multiply(y_grad_perp));

  temp = theta_deformation(x, y, 30);
  x = temp[0];
  y = temp[1];

  x = x.subtract(x.get(0));
  y = y.subtract(y.get(0));

  var v = nj.stack([x, y]).T.tolist().map(function(p) { return new THREE.Vector2(...p); });
  return new THREE.ShapeGeometry(new THREE.Shape(v));
}

function gen_mesh(geometry, color, polygonOffset) {
  if (polygonOffset === undefined) {
    var material = new THREE.MeshBasicMaterial({color: color, side: THREE.DoubleSide});
  } else {
    var material = new THREE.MeshBasicMaterial({color: color, side: THREE.DoubleSide,
                                               polygonOffset: true,
                                               polygonOffsetFactor: polygonOffset});
  }

  return new THREE.Mesh(geometry, material);
}

function theta_deformation(x, y, w) {
  r = nj.sqrt(x.pow(2).add(y.pow(2)));
  theta = arctan2(x, y);

  const N = 200;
  d_theta = theta.max() - theta.min();
  noise = perlin_noise(7, N);
  noise = noise.add(Math.min(0, -d_theta / N - noise.min())).divide(w);

  ty = cumsum(noise.add(d_theta / N)).add(theta.min());
  dtx = d_theta / N;
  theta_pre_indices = theta.subtract(theta.min()).divide(dtx);
  theta = linear_interpolation(theta_pre_indices, ty);

  x = r.multiply(nj.cos(theta));
  y = r.multiply(nj.sin(theta));
  return [x, y];
}

function linear_interpolation(float_indices, index_values) {
  var res = nj.zeros(float_indices.shape[0]);
  for (var i = 0; i < float_indices.shape[0]; i++) {
    var index = Math.floor(float_indices.get(i));
    var dist = float_indices.get(i) - index;
    if (index == index_values.shape[0]) {
      res.set(i, index_values.get(-1));
    } else {
      res.set(i, dist * index_values.get(index + 1) + (1 - dist) * index_values.get(index));
    }
  }

  return res;
}

function cumsum(a) {
  var res = a.clone();
  var s = 0;
  for (var i = 0; i < res.shape[0]; i++) {
    s += res.get(i);
    res.set(i, s);
  }

  return res;
}

function arctan2(x, y) {
  raw_thetas = nj.arctan(y.divide(x));
  for (var i = 0; i < x.shape[0]; i++) {
    if (x.get(i) > 0) {
      // ...
    } else if (y.get(i) > 0) {
      raw_thetas.set(i, Math.PI / 2 - raw_thetas.get(i));
    } else if (y.get(i) < 0) {
      raw_thetas.set(i, -Math.PI / 2 - raw_thetas.get(i));
    } else {
      raw_thetas.set(i, raw_thetas.get(i) - Math.PI);
    }
  }

  return raw_thetas;
}

function clone_butterfly(butterfly) {
    var res = butterfly.clone(true);

    for (var i = 0; i < butterfly.children.length; i++) {
        if (butterfly.children[i].wing_rotation_type !== undefined) {
            res.children[i].wing_rotation_type = "left";
        }
    }

    return res;
}

function gen_butterfly() {
  var settings = {
    stretch_factor: randrange(1.2, 1.5),
    lower_scale: randrange(.85, 1.),
  }

  var r = randrange(0, 1);
  var g = randrange(0, 1);
  var b = randrange(0, 1);
  var e = randrange(.2, .5);
  var min_c = Math.min(r, g, b);
  var max_c = Math.max(r, g, b);
  r = 1 - ((r - min_c) / (max_c - min_c)) * e;
  g = 1 - ((g - min_c) / (max_c - min_c)) * e;
  b = 1 - ((b - min_c) / (max_c - min_c)) * e;
  var color = new THREE.Color(r, g, b);

  var alt_color = make_alt_color(r, g, b);

  var right_upper = gen_mesh(gen_upper_part(settings), color);
  var right_lower = gen_mesh(gen_lower_part(settings), color);
  var left_upper = right_upper.clone();
  var left_lower = right_lower.clone();

  var wing_angle = -randrange(0, Math.PI / 4);
  var interwing_angle = randrange(Math.PI / 5, Math.PI / 3);

  var lower_offset = randrange(.02, .12);
  var yaxis = new THREE.Vector3(0, 1, 0);
  right_lower.translateOnAxis(yaxis, -lower_offset);
  left_lower.translateOnAxis(yaxis, -lower_offset);

  var xaxis = new THREE.Vector3(1, 0, 0);
  right_lower.translateOnAxis(xaxis, .025);
  right_upper.translateOnAxis(xaxis, .025);
  left_lower.translateOnAxis(xaxis, -.025);
  left_upper.translateOnAxis(xaxis, -.025);

  right_upper.rotation.z = interwing_angle / 2 + wing_angle;
  right_lower.rotation.z = -interwing_angle / 2 + wing_angle;
  left_upper.rotation.y = Math.PI;
  left_upper.rotation.z = interwing_angle / 2 + wing_angle;
  left_lower.rotation.y = Math.PI;
  left_lower.rotation.z = -interwing_angle / 2 + wing_angle;

  right_upper.wing_rotation_type = 'right';
  right_lower.wing_rotation_type = 'right';
  left_upper.wing_rotation_type = 'left';
  left_lower.wing_rotation_type = 'left';

  res = [right_upper, right_lower, left_upper, left_lower];

  var lines = [];
  var polygons = [];
  var linecolorcoef = randrange(.4, .8);
  var linecolor = new THREE.Color(linecolorcoef * r, linecolorcoef * g, linecolorcoef * b);
  var linewidth = randrange(.002, .006);

  var upper_lines_and_polygons = gen_lines(right_upper);
  fuzzlines(upper_lines_and_polygons[0]);
  var upper_lines = make_meshes_from_lines(upper_lines_and_polygons[0], linecolor, linewidth);
  var upper_polygons = make_meshes_from_polygons(recover_polygons(upper_lines_and_polygons[1]), alt_color);
  lines = lines.concat(adjust_lines(upper_lines, right_upper));
  lines = lines.concat(adjust_lines(upper_lines, left_upper));
  polygons = polygons.concat(adjust_lines(upper_polygons, right_upper));
  polygons = polygons.concat(adjust_lines(upper_polygons, left_upper));
  var lower_lines_and_polygons = gen_lines(right_lower);
  fuzzlines(lower_lines_and_polygons[0]);
  var lower_lines = make_meshes_from_lines(lower_lines_and_polygons[0], linecolor, linewidth);
  var lower_polygons = make_meshes_from_polygons(recover_polygons(lower_lines_and_polygons[1]), alt_color);
  lines = lines.concat(adjust_lines(lower_lines, right_lower));
  lines = lines.concat(adjust_lines(lower_lines, left_lower));
  polygons = polygons.concat(adjust_lines(lower_polygons, right_lower));
  polygons = polygons.concat(adjust_lines(lower_polygons, left_lower));

  if (randrange(0, 1) <= .7) {
    var black_material = new THREE.MeshToonMaterial({color: 0x000000, side: THREE.DoubleSide,
                                                     polygonOffset: true,
                                                     polygonOffsetFactor: .1});
    var outline_scale = randrange(.05, .12);
    if (randrange(0, 1) <= .5) {
      outline_scale = randrange(.2, .3);
    }

    outline_scale = 1 + outline_scale;

    right_upper_outline = right_upper.clone();
    right_upper_outline.wing_rotation_type = 'right';
    right_upper_outline.material = black_material;
    right_upper_outline.scale.x = right_upper_outline.scale.y = right_upper_outline.scale.z = outline_scale;

    right_lower_outline = right_lower.clone();
    right_lower_outline.wing_rotation_type = 'right';
    right_lower_outline.material = black_material;
    right_lower_outline.scale.x = right_lower_outline.scale.y = right_lower_outline.scale.z = outline_scale;

    left_upper_outline = left_upper.clone();
    left_upper_outline.wing_rotation_type = 'right';
    left_upper_outline.material = black_material;
    left_upper_outline.scale.x = left_upper_outline.scale.y = left_upper_outline.scale.z = outline_scale;

    left_lower_outline = left_lower.clone();
    left_lower_outline.wing_rotation_type = 'right';
    left_lower_outline.material = black_material;
    left_lower_outline.scale.x = left_lower_outline.scale.y = left_lower_outline.scale.z = outline_scale;

    outlines = [right_upper_outline, right_lower_outline, left_upper_outline, left_lower_outline]
    if (outline_scale >= .2 && randrange(0, 1) <= .5) {
      var circle_r = randrange(.1, .2);
      var circle_n = Math.round(randrange(3, 8));

      var circles = [];
      for (var i = 0; i < outlines.length; i++) {
        var segment = res[i];
        var segment_outline = outlines[i];
        segment.updateMatrix();
        circles = circles.concat(gen_segment_circles(segment, outline_scale, circle_r, circle_n));
      }

      outlines = outlines.concat(circles);
    }

    res = outlines.concat(res);
  }

  res = res.concat(polygons);
  res = res.concat(lines);
  res = res.concat(gen_body());

  var group = new THREE.Group();
  for (var i = 0; i < res.length; i++) {
    group.add(res[i]);
  }

  return group;
}

function make_alt_color(r, g, b) {
  var roll = randrange(0, 1)
  if (roll <= .2) {
    var dim = randrange(.2, .6);
    r = dim * r;
    g = dim * g;
    b = dim * b;
  } else if (roll <= .4) {
    var light = randrange(1.1, Math.min(1 / r, 1 / g, 1 / b));
    r = Math.min(1, light * r);
    g = Math.min(1, light * g);
    b = Math.min(1, light * b);
  } else {
    r = randrange(0, 1);
    g = randrange(0, 1);
    b = randrange(0, 1);
    var e = randrange(.2, .5);
    var min_c = Math.min(r, g, b);
    var max_c = Math.max(r, g, b);
    r = 1 - ((r - min_c) / (max_c - min_c)) * e;
    g = 1 - ((g - min_c) / (max_c - min_c)) * e;
    b = 1 - ((b - min_c) / (max_c - min_c)) * e;
  }

  return new THREE.Color(r, g, b);
}

function gen_lines(segment) {
  var lines = [];
  var polygons = [];
  var perimeter_lines = [];
  var perimeter_points = [];
  var curr_line = [[perimeter_lines, 0, true]];
  var x = nj.array(segment.geometry.vertices.map(v => v.x));
  var y = nj.array(segment.geometry.vertices.map(v => v.y));
  var xy = nj.stack([x, y]).T;
  var s = x.shape[0];

  bifurcate(lines, xy.slice([Math.round(s / 4), -Math.round(s / 4)]),
            xy.slice([0, 1]).reshape(-1), 2, polygons, perimeter_points, curr_line, perimeter_lines);

  perimeter_indices = [0];
  for (var i = 0; i < perimeter_points.length; i++) {
    for (var j = 0; j < xy.shape[0]; j++) {
      if (xy.get(j, 0) == perimeter_points[i].get(0) &&
          xy.get(j, 1) == perimeter_points[i].get(1)) {
        perimeter_indices.push(j);
        break;
      }
    }
  }

  perimeter_indices.push(segment.geometry.vertices.length);

  for (var i = 0; i < perimeter_indices.length - 1; i++) {
    perimeter_lines.push(xy.slice([perimeter_indices[i], perimeter_indices[i + 1]]));
  }

  return [lines, polygons];
}

function fuzzlines(lines) {
  for (var i = 0; i < lines.length; i++) {
    lines[i] = fuzzline(lines[i]);
  }
}

function fuzzline(line) {
  var N = 100;
  var x1 = line.get(0, 0), x2 = line.get(1, 0), y1 = line.get(0, 1), y2 = line.get(1, 1);
  var x = linspace(x1, x2, N);
  var y = linspace(y1, y2, N);

  var grad_perp_x = y1 - y2;
  var grad_perp_y = x2 - x1;
  var norm = Math.sqrt(grad_perp_x * grad_perp_x + grad_perp_y * grad_perp_y);
  grad_perp_x /= norm;
  grad_perp_y /= norm;

  var noise = perlin_noise(3, N + 1).multiply(.08).add(perlin_noise(Math.round(randrange(7, 14)), N + 1).multiply(.035));
  x = x.add(noise.multiply(grad_perp_x));
  y = y.add(noise.multiply(grad_perp_y));

  return nj.stack([x, y]).T;
}

function linspace(a0, a1, n) {
  var d = (a1 - a0) / n;
  return nj.array(nj.arange(0, n + 1).tolist().map(i => a0 + i * d));
}

function make_meshes_from_lines(lines, color, linewidth) {
  var material = new MeshLineMaterial({color: color,
                                       lineWidth: linewidth,
                                       sizeAttenuation: 0,
                                       polygonOffset: true,
                                       polygonOffsetFactor: -.05});

  return lines.
          map(line => line.tolist().map(p => new THREE.Vector3(p[0], p[1], p.length == 2 ? 0 : p[2]))).
          map(p => new THREE.Mesh(meshline(p), material));
}

function make_meshes_from_polygons(polygons, color) {
  var new_polygons = [];

  for (var i = 0; i < polygons.length; i++) {
    if (randrange(0, 1) <= .3) {
      new_polygons.push(polygons[i]);
    }
  }

  return new_polygons.map(function(polygon) {
    return gen_mesh(new THREE.ShapeGeometry(new THREE.Shape(
      polygon.tolist().map(p => new THREE.Vector2(...p)))), color, -.05);
  });
}

function bifurcate(lines, polygon, p0, counts, polygons, perimeter_points, curr_line, perimeter_lines) {
  var n = Math.round(randrange(2, 5));
  var k = Math.round(polygon.shape[0] / n);
  for (var i = 0; i < n; i++) {
    var sub_points = polygon.slice([i * k, (i + 1) * k]);
    chosen_index = Math.floor(randrange(sub_points.shape[0] / 3, 2 * sub_points.shape[0] / 3));
    var p1 = sub_points.slice([chosen_index, chosen_index + 1]).reshape(-1);
    if (counts > 1) {
      var length = randrange(.3, .7);
      p1 = p0.add(p1.subtract(p0).multiply(length));
    }

    var line_index = lines.length;
    curr_line.push([lines, line_index, false]);
    lines.push(nj.array([p0.tolist(), p1.tolist()]));

    if (counts > 1) {
      bifurcate(lines, sub_points, p1, counts - 1, polygons, perimeter_points, curr_line, perimeter_lines);
    } else {
      perimeter_points.push(p1);
      polygons.push([...curr_line]);
      curr_line.splice(0, curr_line.length);
      curr_line.push([perimeter_lines, perimeter_points.length, true]);
    }

    curr_line.push([lines, line_index, true]);
  }
}

function meshline(points) {
  var line = new MeshLine();
  line.setPoints(points);

  return line;
}

function adjust_lines(lines, segment) {
  var res = [];
  segment.updateMatrix();
  for (var i = 0; i < lines.length; i++) {
    new_line = lines[i].clone();
    new_line.applyMatrix4(segment.matrix);
    if (segment.wing_rotation_type !== undefined) {
      new_line.wing_rotation_type = 'right';
    }

    res.push(new_line);
  }

  return res;
}

function recover_polygons(polygons) {
  return polygons.map(recover_polygon);
}

function recover_polygon(polygon) {
  lines = [];
  for (var i = 0; i < polygon.length; i++) {
    var source = polygon[i][0];
    var index = polygon[i][1];
    var is_reversed = polygon[i][2];
    if (is_reversed) {
      lines.push(source[index].slice([0, source[index].shape[0], -1]));
    } else {
      lines.push(source[index]);
    }
  }

  return nj.concatenate(lines.map(x => x.T)).T;
}

function gen_body() {
  var attenuation_exp = randrange(12, 20);
  var attenuation_offset = randrange(.7, 1.1);
  var geometry = new THREE.SphereGeometry(.4, 32, 32,);
  var miny = Math.min(...geometry.vertices.map(p => p.y));
  for (var i = 0; i < geometry.vertices.length; i++) {
    var d = Math.sqrt(Math.pow(geometry.vertices[i].y - miny, 2) +
                      Math.pow(geometry.vertices[i].x, 2) +
                      Math.pow(geometry.vertices[i].z, 2));
    geometry.vertices[i].y -= 1.2 * y_attenuation(d, attenuation_exp, attenuation_offset);
  }

  var material = new THREE.MeshToonMaterial({color: gen_body_color()});
  var sphere = new THREE.Mesh(geometry, material);
  sphere.scale.x = .3;
  sphere.scale.z = .3;

  var line = gen_feeler_line();
  var other_line = line.clone();
  other_line.slice([], [0, 1]).assign(other_line.slice([], [0, 1]).multiply(-1), false);

  var black = new THREE.Color(0, 0, 0);

  var feeler_orb_center = line.slice([0, 1]).reshape(3).tolist();

  var orb1_geometry = new THREE.SphereGeometry(randrange(.03, .07), 16, 16);
  var orb1 = new THREE.Mesh(orb1_geometry, new THREE.MeshToonMaterial({color: gen_body_color()}));
  orb1.position.x = feeler_orb_center[0];
  orb1.position.y = feeler_orb_center[1];
  orb1.position.z = feeler_orb_center[2];
  var orb2 = orb1.clone();
  orb2.position.x *= -1;

  return [sphere, orb1, orb2, ...make_meshes_from_lines([line, other_line], black, .0025)];
}

function gen_feeler_line() {
  var w = randrange(.6, 1);
  var h = randrange(.4, 1.2);
  var d = randrange(.4, .7);
  var N = 20;

  var x = linspace(0, w, N);
  var y = linspace(0.25, h, N);
  var z = linspace(0, d, N);

  z = z.multiply(z).multiply(-1).slice([0, z.shape[0], -1]);
  z = z.subtract(z.min()).divide(z.max() - z.min()).multiply(d);


  var line = nj.stack([x, y, z]).T.slice([0, z.shape[0], -1]);
  return line;
}

function gen_body_color() {
  var brightness = .933;

  var r = randrange(.85, .93);
  var b = randrange(.2, 1);
  var g = brightness - 0.2126 * r - 0.0722 * b;

  return new THREE.Color(r, g, b);
}

function y_attenuation(d, attenuation_exp, attenuation_offset) {
  return 1 / (Math.pow(d + attenuation_offset, attenuation_exp) + 1);
}

function gen_segment_circles(segment, outline_scale, circle_r, circle_n) {
  var x = nj.array(segment.geometry.vertices.map(v => v.x));
  var y = nj.array(segment.geometry.vertices.map(v => v.y));
  var mult = 1 + (outline_scale - 1) / 2;
  var s = x.shape[0];

  var circles = [];
  for (var j = 0; j < circle_n; j++) {
    var k = Math.round(s / 3 + (s / (3 * circle_n)) * j);
    circles.push(gen_circle(x.get(k) * mult, y.get(k) * mult, .2 * mult * circle_r, segment));
  }

  return circles;
}

function gen_circle(cx, cy, r, obj) {
  var t = nj.arange(0, 2 * Math.PI, 1 / 100);
  var x = nj.cos(t).multiply(r).add(cx);
  var y = nj.sin(t).multiply(r).add(cy);
  var v = nj.stack([x, y]).T.tolist().map(function(p) { return new THREE.Vector2(...p); });
  var circle = new gen_mesh(new THREE.ShapeGeometry(new THREE.Shape(v)), 0xFFFFFF);
  circle.applyMatrix4(obj.matrix);
  if (obj.wing_rotation_type !== undefined) {
    circle.wing_rotation_type = 'right';
  }

  return circle;
}

var replace_butterflies = null;

window.onhashchange = function(e) {
  rng = new Math.seedrandom(location.hash.slice(1));
  if (replace_butterflies != null) {
    replace_butterflies();
  }
}

window.onload = function() {
  document.getElementById('generate').onclick = function() {
    location.hash = new Date().getTime().toString();
  }

  if (location.hash.slice(1) == '') {
    location.hash = new Date().getTime().toString();
  }

  rng = new Math.seedrandom(location.hash.slice(1));

  const canvas = document.querySelector('canvas');
  const renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true});

  const fov = 45;
  const aspect = 1.5;
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 3;
  camera.position.y = -10;
  camera.position.x = 0;
  camera.up = new THREE.Vector3(0, 0, 1);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.sortObjects = false;

  const scene = new THREE.Scene();

  const color = 0xFFFFFF;
  const intensity = 1;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(2.5, 2, 2);
  scene.add(light);

  var butterflies = [];

  var prev_time;

  replace_butterflies = function() {
    if (animation_frame_id !== null) {
        cancelAnimationFrame(animation_frame_id);
    }

    prev_time = null;
    for (var j = 0; j < butterflies.length; j++) {
        for (var i = 0; i < butterflies[j].children.length; i++) {
            butterflies[j].children[i].material.dispose();
            butterflies[j].children[i].geometry.dispose();
        }

        scene.remove(butterflies[j]);
    }

    butterflies = [];

    var base_butterfly = gen_butterfly();

    for (var i = 0; i < 350; i++) {
        if (randrange(0, 1) <= .01) {
            base_butterfly = gen_butterfly();
        }

        butterflies.push(clone_butterfly(base_butterfly));
        var scale = randrange(.15, .35)
        butterflies[i].scale.set(scale, scale, scale);
        butterflies[i].wing_flap_speed_coef = randrange(2.5, 5);
        butterflies[i].position.x = randrange(-1, 1);
        butterflies[i].position.y = randrange(-1, 1);
        butterflies[i].position.z = randrange(-1, 1);
        butterflies[i].wing_flap_speed_phase = randrange(0, 2 * 3.1415);
        butterflies[i].prev_wing_rotation = 0;
        butterflies[i].prev_z_offset = 0;
        butterflies[i].velocity = (
            (new THREE.Vector3(randrange(-.5, .5), randrange(-.5, .5), randrange(-.5, .5)))
            .normalize().multiplyScalar(randrange(.9, 1.3))
        );
        scene.add(butterflies[i]);
    }

    animation_frame_id = requestAnimationFrame(render);
  }

  replace_butterflies();

  function render(time) {
    var dt = null;
    if (prev_time !== null) {
        dt = (time - prev_time) / 200;
        boid_behavior(butterflies, dt);
    }

    prev_time = time;

    for (var j = 0; j < butterflies.length; j++) {

        if (dt !== null) {
            butterflies[j].position.add(butterflies[j].velocity.clone().multiplyScalar(dt));
        }

        butterflies[j].rotation.z = Math.atan2(butterflies[j].velocity.y, butterflies[j].velocity.x) - Math.PI / 2;
        z_offset = Math.sin(time / 200 * butterflies[j].wing_flap_speed_coef
                                     + butterflies[j].wing_flap_speed_phase
                                     + Math.PI) / 7;
        butterflies[j].position.z += z_offset - butterflies[j].prev_z_offset;
        butterflies[j].prev_z_offset = z_offset;

        var wing_rotation = Math.sin(time / 200 * butterflies[j].wing_flap_speed_coef
                                     + butterflies[j].wing_flap_speed_phase) * (Math.PI * .4);
        for (var i = 0; i < butterflies[j].children.length; i++) {
          if (butterflies[j].children[i].wing_rotation_type !== undefined) {
            if (butterflies[j].children[i].wing_rotation_type == 'right') {
              butterflies[j].children[i].rotation.y += wing_rotation - butterflies[j].prev_wing_rotation;
            } else {
              butterflies[j].children[i].rotation.y -= wing_rotation - butterflies[j].prev_wing_rotation;
            }
          }
        }

        butterflies[j].prev_wing_rotation = wing_rotation;
    }

    renderer.render(scene, camera);

    animation_frame_id = requestAnimationFrame(render);
  }

  animation_frame_id = requestAnimationFrame(render);
}

function boid_behavior(butterflies, dt) {
    var RADIUS = 1;
    var MAX_RADIUS = 4;
    var ALPHA = .9;
    var ORIGIN = new THREE.Vector3(0, 0, 0);
    for (var i = 0; i < butterflies.length; i++) {
        var magnitude = butterflies[i].velocity.distanceTo(ORIGIN);
        var n_neighbours = 0;
        var push_velocity = new THREE.Vector3(0, 0, 0);
        var center_position = new THREE.Vector3(0, 0, 0);
        var mean_velocity = new THREE.Vector3(0, 0, 0);
        for (var j = 0; j < butterflies.length; j++) {
            if (i != j) {
                dist = butterflies[i].position.distanceTo(butterflies[j].position);
                if (dist < RADIUS) {
                    n_neighbours += 1;
                    push_velocity.add(
                        butterflies[i].position.clone()
                        .sub(butterflies[j].position).normalize()
                        .multiplyScalar(1 / dist)
                    );
                    center_position.add(butterflies[j].position);
                    mean_velocity.add(butterflies[j].velocity);
                }
            }
        }

        push_velocity.normalize();

        var center_velocity = new THREE.Vector3(0, 0, 0);

        if (n_neighbours > 0) {
            center_velocity = (
                center_position.multiplyScalar(1 / n_neighbours)
                .sub(butterflies[i].position).normalize()
            );
        }

        var total_velocity = (
            push_velocity
            .add(center_velocity)
            .add(mean_velocity)
            .add((new THREE.Vector3(randrange(0, 1), randrange(0, 1), randrange(0, 1)))
                 .normalize().multiplyScalar(.05))
        );

        if (butterflies[i].position.distanceTo(ORIGIN) > MAX_RADIUS) {
            total_velocity.add(butterflies[i].position.clone().normalize().multiplyScalar(-1));
        }

        total_velocity.normalize();

        (
            butterflies[i].velocity
            .multiplyScalar(ALPHA).add(total_velocity.multiplyScalar(1 - ALPHA))
            .normalize().multiplyScalar(magnitude)
        );
    }
}