window.onload = function() {
  generate_grid();

  document.getElementById("btn-clear").onclick = function() {
    var path2delete = document.getElementsByClassName('overlay-path');
    var n = path2delete.length;
    for (var i = 0; i < n; i++) {
      path2delete[0].parentNode.removeChild(path2delete[0]);
    }
  }

  document.getElementById("btn-regenerate").onclick = function() {
    var svg = document.getElementById('organic_grid_svg');
    var n = svg.children.length;
    var i = 0;
    var j = 0;
    for (var i = 0; i < n; i++) {
      if (svg.children[j].tagName == 'rect') {
        j += 1;
      } else {
        svg.removeChild(svg.children[j]);
      }
    }

    generate_grid();
  }
}

function generate_grid() {
  var blue_noise = poisson_disk_sampling(0.1, 30);

  var d_triangles = Delaunator.from(blue_noise).triangles;
  var triangles = [];
  for (var i = 0; i < d_triangles.length; i += 3) {
    triangles.push([d_triangles[i], d_triangles[i + 1], d_triangles[i + 2]]);
  }

  var MAX_ANGLE = Math.PI / 2 * 1.65;
  var i = 0;
  while (i < triangles.length) {
    var t = triangles[i];
    var dists = [dist(...blue_noise[t[0]], ...blue_noise[t[1]]),
                 dist(...blue_noise[t[1]], ...blue_noise[t[2]]),
                 dist(...blue_noise[t[2]], ...blue_noise[t[0]])];
    dists.sort((a, b) => a - b);
    var c = dists.pop();
    var b = dists.pop();
    var a = dists.pop();
    if (Math.acos((a ** 2 + b ** 2 - c ** 2) / (2 * a * b)) >= MAX_ANGLE) {
      triangles.splice(i, 1);
    } else {
      i++;
    }
  }

  var prequads = [];

  function legit_prequad(candidate_prequad) {
    var cross_products = [];
    var dot_products = [];
    for (var i = 0; i < 4; i++) {
      var p_prev = nj.array(blue_noise[candidate_prequad[(i - 1 + 4) % 4]]);
      var p_curr = nj.array(blue_noise[candidate_prequad[i]]);
      var p_next = nj.array(blue_noise[candidate_prequad[(i + 1) % 4]]);
      var d1 = p_curr.subtract(p_prev);
      var d2 = p_next.subtract(p_curr);
      cross_products.push(d1.get(0) * d2.get(1) - d1.get(1) * d2.get(0));
      dot_products.push((d1.multiply(d2).sum()) /
       (dist(0, 0, ...d1.tolist()) * dist(0, 0, ...d2.tolist())));
    }

    return (new Set(cross_products.map(Math.sign)).size == 1 &&
            nj.arccos(dot_products).max() <= Math.PI * 0.9 &&
            nj.arccos(dot_products).min() >= Math.PI * 0.2);
  }

  var tabu_edges = new Set();
  while (triangles.length > 1) {
    var edge_counts = {};
    for (var i = 0; i < triangles.length; i++) {
      var t = triangles[i];
      var triangle_edges = [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]];
      for (var j = 0; j < triangle_edges.length; j++) {
        var min_v = Math.min(...triangle_edges[j]);
        var max_v = Math.max(...triangle_edges[j]);
        var edge_desc = min_v.toString() + '-' + max_v.toString();
        if (!tabu_edges.has(edge_desc)) {
          if (!(edge_desc in edge_counts)) {
            edge_counts[edge_desc] = 0;
          }

          edge_counts[edge_desc] += 1;
        }
      }
    }

    var candidate_edges = [];
    var edge_keys = Object.keys(edge_counts);
    for (var i = 0; i < edge_keys.length; i++) {
      if (edge_counts[edge_keys[i]] > 1) {
        candidate_edges.push(edge_keys[i].split('-').map(x => parseInt(x)));
      }
    }

    if (candidate_edges.length == 0) break;

    while (candidate_edges.length > 0) {
      var candidate_index = Math.floor(Math.random() * candidate_edges.length);
      var candidate_edge = candidate_edges.splice(candidate_index, 1)[0];
      var merge_triangles = [];
      var merge_triangle_indices = [];
      var unique_vertices = [];
      for (var i = 0; i < triangles.length; i++) {
        if (triangles[i].indexOf(candidate_edge[0]) >= 0 &&
         triangles[i].indexOf(candidate_edge[1]) >= 0) {
           merge_triangles.push(triangles[i]);
           merge_triangle_indices.push(i);
           for (var j = 0; j < triangles[i].length; j++) {
             if (candidate_edge.indexOf(triangles[i][j]) < 0) {
               unique_vertices.push(triangles[i][j]);
             }
           }
         }
      }

      var candidate_quad = [candidate_edge[0], unique_vertices[0],
                            candidate_edge[1], unique_vertices[1]];

      if (legit_prequad(candidate_quad)) {
        prequads.push(candidate_quad);
        triangles.splice(merge_triangle_indices[1], 1);
        triangles.splice(merge_triangle_indices[0], 1);

        break;
      } else {
        tabu_edges.add(candidate_edge[0].toString() + '-' + candidate_edge[1].toString());
      }
    }
  }

  var midpoints = {};
  var midpoints_index = {};
  var quads = [];
  for (var i = 0; i < triangles.length; i++) {
    var t = triangles[i];
    var center = mean_on_axis0(nj.array(fancy_index(blue_noise, t)));
    var center_index = blue_noise.length;
    blue_noise.push(center.tolist());
    var t_edges = [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]];

    for (var j = 0; j < t_edges.length; j++) {
      var edge_key = make_edge_key(t_edges[j]);
      if (!(edge_key in midpoints)) {
        midpoints[edge_key] =
          mean_on_axis0(nj.array(fancy_index(blue_noise, t_edges[j])));
        midpoints_index[edge_key] = blue_noise.length;
        blue_noise.push(midpoints[edge_key].tolist());
      }
    }

    for (var j = 0; j < t_edges.length; j++) {
      var e1 = t_edges[j];
      var e2 = t_edges[(j + 1) % (t_edges.length)];
      var e1_key = make_edge_key(e1);
      var e2_key = make_edge_key(e2);
      var e1_midpoint_index = midpoints_index[e1_key];
      var e2_midpoint_index = midpoints_index[e2_key];
      var common_vertex = e1[0];
      if (e2.indexOf(common_vertex) == -1) {
        common_vertex = e1[1];
      }

      quads.push([common_vertex, e1_midpoint_index, center_index, e2_midpoint_index]);
    }
  }

  for (var i = 0; i < prequads.length; i++) {
    var pq = prequads[i];
    var center = mean_on_axis0(nj.array(fancy_index(blue_noise, pq)));
    var center_index = blue_noise.length;
    blue_noise.push(center.tolist());
    var pq_edges = [[pq[0], pq[1]], [pq[1], pq[2]], [pq[2], pq[3]], [pq[3], pq[0]]];

    for (var j = 0; j < pq_edges.length; j++) {
      var edge_key = make_edge_key(pq_edges[j]);
      if (!(edge_key in midpoints)) {
        midpoints[edge_key] =
          mean_on_axis0(nj.array(fancy_index(blue_noise, pq_edges[j])));
        midpoints_index[edge_key] = blue_noise.length;
        blue_noise.push(midpoints[edge_key].tolist());
      }
    }

    for (var j = 0; j < pq_edges.length; j++) {
      var e1 = pq_edges[j];
      var e2 = pq_edges[(j + 1) % (pq_edges.length)];
      var e1_key = make_edge_key(e1);
      var e2_key = make_edge_key(e2);
      var e1_midpoint_index = midpoints_index[e1_key];
      var e2_midpoint_index = midpoints_index[e2_key];
      var common_vertex = e1[0];
      if (e2.indexOf(common_vertex) == -1) {
        common_vertex = e1[1];
      }

      quads.push([common_vertex, e1_midpoint_index, center_index, e2_midpoint_index]);
    }
  }

  for (var i = 0; i < quads.length; i++) {
    var p0 = nj.array(blue_noise[quads[i][0]]);
    var p1 = nj.array(blue_noise[quads[i][1]]);
    var p2 = nj.array(blue_noise[quads[i][2]]);
    var d1 = p1.subtract(p0);
    var d2 = p2.subtract(p1);
    if (d1.get(0) * d2.get(1) - d1.get(1) * d2.get(0) > 0) {
      quads[i].reverse();
    }
  }

  blue_noise = nj.array(blue_noise);

  var SIDE_LENGTH = .06;
  var r = SIDE_LENGTH / Math.sqrt(2);
  var PULL_RATE = .3;
  var forces = nj.zeros(blue_noise.shape);
  var lines2del = [];
  var n_iters = 100;

  function post_loop() {
    blue_noise = blue_noise.multiply(150).subtract(25).tolist();

    var added_lines = new Set();
    for (var i = 0; i < quads.length; i++) {
      for (var j = 0; j < 4; j++) {
        var line_p1 = quads[i][j];
        var line_p2 = quads[i][(j + 1) % 4];
        var line_key = make_edge_key([line_p1, line_p2]);
        if (!added_lines.has(line_key)) {
          add_line(blue_noise[line_p1][0], blue_noise[line_p1][1],
            blue_noise[line_p2][0], blue_noise[line_p2][1]);
          added_lines.add(line_key);
        }
      }

      var center = mean_on_axis0(nj.stack(fancy_index(blue_noise, quads[i])));
      var cx = center.get(0);
      var cy = center.get(1);
      var R = .3;
    }

    var curr_color = 'color-1';
    var mouse_down = false;

    for (var i = 0; i < blue_noise.length; i++) {
      vertex_quads = [];
      for (var j = 0; j < quads.length; j++) {
        if (quads[j].indexOf(i) >= 0) {
          vertex_quads.push(quads[j]);
        }
      }

      if (vertex_quads.length < 3) continue;

      var centers = (vertex_quads.map(q => fancy_index(blue_noise, q))
                                 .map(nj.array).map(mean_on_axis0));
      var vertex = nj.array(blue_noise[i]);
      centers.sort(function(p1, p2) {
        var d1 = p1.subtract(vertex);
        var d2 = p2.subtract(vertex);
        return Math.atan2(d1.get(1), d1.get(0)) - Math.atan2(d2.get(1), d2.get(0));
      });

      centers = centers.map(x => x.tolist());
      var polygon = add_path(centers);
      polygon.data = centers;
      polygon.add = function() {
        var centers = this.data;
        var new_elem = add_path(centers, curr_color);
        new_elem.onmouseup = function() {
          mouse_down = false;
        }
      }
      polygon.onmousedown = function() {
        this.add();
        mouse_down = true;
      }

      polygon.onmouseup = function() {
        mouse_down = false;
      }

      polygon.onmouseenter = function() {
        if (mouse_down) {
          this.add();
        }
      }
    }

    var svg = document.getElementById('organic_grid_svg');
    svg.onmouseleave = function() {
      mouse_down = false;
    }

    var color_buttons = document.getElementsByClassName('color-button');
    for (var i = 0; i < color_buttons.length; i++) {
      color_buttons[i].onclick = function() {
        curr_color = this.classList[1];
      }
    }
  }

  function loop_iter() {
    forces = forces.multiply(0);
    for (var j = 0; j < quads.length; j++) {
      var quad = quads[j];
      var temp_xy = [];
      for (var k = 0; k < quad.length; k++) {
        temp_xy.push(blue_noise.pick(quad[k]));
      }

      temp_xy = nj.stack(temp_xy);
      temp_xy = temp_xy.subtract(repeat(mean_on_axis0(temp_xy), temp_xy.shape[0]));
      var denom = temp_xy.get(0, 0) - temp_xy.get(1, 1) -
        temp_xy.get(2, 0) + temp_xy.get(3, 1);
      var d_sign = Math.sign(denom);
      if (d_sign == 0) d_sign = 1;

      denom = d_sign * Math.max(1e-10, Math.abs(denom));
      var numerator = temp_xy.get(0, 1) + temp_xy.get(1, 0) -
        temp_xy.get(2, 1) - temp_xy.get(3, 0);

      var alpha = Math.atan(numerator / denom);

      if (Math.cos(alpha) * denom + Math.sin(alpha) * numerator < 0) {
        alpha += Math.PI;
      }

      var cosalpha = Math.cos(alpha);
      var sinalpha = Math.sin(alpha);

      var xyt = nj.array([
        [r * cosalpha, r * sinalpha],
        [r * sinalpha, -r * cosalpha],
        [-r * cosalpha, -r * sinalpha],
        [-r * sinalpha, r * cosalpha]
      ]);

      var diff = xyt.subtract(temp_xy);

      for (var k = 0; k < diff.shape[0]; k++) {
        forces.pick(quad[k]).assign(forces.pick(quad[k]).add(diff.pick(k)),
          false);
      }
    }

    blue_noise = blue_noise.add(forces.multiply(PULL_RATE));
    var temp_blue_noise = blue_noise.multiply(150).subtract(25).tolist();

    for (var j = 0; j < lines2del.length; j++) {
      lines2del[j].parentNode.removeChild(lines2del[j]);
    }

    lines2del = [];

    var added_lines = new Set();
    for (var j = 0; j < quads.length; j++) {
      for (var k = 0; k < 4; k++) {
        var line_p1 = quads[j][k];
        var line_p2 = quads[j][(k + 1) % 4];
        var line_key = make_edge_key([line_p1, line_p2]);
        if (!added_lines.has(line_key)) {
          lines2del.push(add_line(temp_blue_noise[line_p1][0], temp_blue_noise[line_p1][1],
            temp_blue_noise[line_p2][0], temp_blue_noise[line_p2][1], 'temp-line'));
          added_lines.add(line_key);
        }
      }
    }

    if (n_iters > 0) {
      n_iters -= 1;
      setTimeout(loop_iter, 0);
    } else {
      for (var j = 0; j < lines2del.length; j++) {
        lines2del[j].parentNode.removeChild(lines2del[j]);
      }
      post_loop();
    }
  }

  setTimeout(loop_iter, 0);
}

function fancy_index(a, idx) {
  var res = [];
  for (var i = 0; i < idx.length; i++) {
    res.push(a[idx[i]]);
  }

  return res;
}

function add_circle(x, y) {
  var svg = document.getElementById('organic_grid_svg');
  var newElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  newElement.setAttribute("cx", x);
  newElement.setAttribute("cy", y);
  svg.appendChild(newElement);
}

function add_line(x1, y1, x2, y2, line_class) {
  var svg = document.getElementById('organic_grid_svg');
  var newElement = document.createElementNS("http://www.w3.org/2000/svg", "line");
  newElement.setAttribute("x1", x1);
  newElement.setAttribute("y1", y1);
  newElement.setAttribute("x2", x2);
  newElement.setAttribute("y2", y2);

  if (line_class !== undefined) {
    newElement.classList.add(line_class);
  }

  svg.appendChild(newElement);
  return newElement;
}

function add_polygon(points) {
  var svg = document.getElementById('organic_grid_svg');
  var newElement = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  var points_str = "";
  for (var i = 0; i < points.length; i++) {
    points_str += points[i][0] + "," + points[i][1] + " ";
  }

  newElement.setAttribute("points", points_str);
  svg.appendChild(newElement);
}

function add_path(points, elem_class) {
  var svg = document.getElementById('organic_grid_svg');
  var newElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
  var e = points.length - 1;
  var l = points.length;
  var points_str = "M " + (points[e][0] + points[0][0]) / 2 + " " + (points[e][1] + points[0][1]) / 2 + " ";
  for (var i = 0; i < points.length; i++) {
    var p = points[i][0] + " " + points[i][1];
    points_str += " C " + p + " " + p + " " +
      (points[i][0] + points[(i + 1) % l][0]) / 2 + " " +
      (points[i][1] + points[(i + 1) % l][1]) / 2;
  }

  newElement.setAttribute("d", points_str);
  if (elem_class !== undefined) {
    newElement.classList.add(elem_class);
    newElement.classList.add('overlay-path');
  }

  svg.appendChild(newElement);
  return newElement;
}


function poisson_disk_sampling(r, k) {
  var x0 = Math.random(), y0 = Math.random();
  var cell_size = r / Math.sqrt(2);
  var x = [x0];
  var y = [y0];

  var indices = nj.ones([Math.ceil(1 / cell_size), Math.ceil(1 / cell_size)]).multiply(-1);
  indices.set(Math.floor(y0 / cell_size), Math.floor(x0 / cell_size), 0);
  var active = [0];

  while (active.length > 0) {
    var s = active.shift();
    var sx = x[s];
    var sy = y[s];

    var i = 0;
    while (i < k) {
      i++;
      var theta = Math.random() * Math.PI * 2;
      var r2 = Math.random() * r + r;
      var x2 = sx + r2 * Math.cos(theta);
      var y2 = sy + r2 * Math.sin(theta);
      if (x2 < 0 || y2 < 0 || x2 > 1 || y2 > 1) continue;

      var xi = Math.floor(x2 / cell_size);
      var yi = Math.floor(y2 / cell_size);

      if (indices.get(yi, xi) >= 0) continue;

      var too_close = false;
      for (var j = Math.max(0, yi - 2); j < Math.min(indices.shape[0] - 1, yi + 2) + 1; j++) {
        for (var l = Math.max(0, xi - 2); l < Math.min(indices.shape[1] - 1, xi + 2) + 1; l++) {
          if ((indices.get(j, l) >= 0) && (dist(x2, y2, x[indices.get(j, l)], y[indices.get(j, l)]) <= r)) {
            too_close = true;
            break;
          }
        }

        if (too_close) break;
      }

      if (!too_close) {
        indices.set(yi, xi, x.length);
        active.push(x.length);
        x.push(x2);
        y.push(y2);
        break;
      }
    }

    if (i < k) {
      active.unshift(s);
    }
  }

  return nj.stack([x, y]).multiply(.85).add(.075).T.tolist();
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
}

function mean_on_axis0(arr) {
  var res = nj.zeros(arr.shape[1]);
  for (var i = 0; i < arr.shape[0]; i++) {
    res = res.add(arr.pick(i));
  }

  return res.divide(arr.shape[0]);
}

function make_edge_key(edges) {
  edges.sort();
  return edges[0].toString() + '-' + edges[1].toString();
}

function repeat(a, n) {
  var res = [];
  for (var i = 0; i < n; i++) {
    res.push(a);
  }

  return nj.stack(res);
}
