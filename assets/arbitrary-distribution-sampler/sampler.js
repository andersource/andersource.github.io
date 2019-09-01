var distribution, prev_x, prev_y;
var mouse_down = false;
var CANVAS_BUFFER = 50;
var UNIFORM, NORMAL, SKYLINE;

function init_distributions() {
	var canvas = document.getElementById("draw_distribution");
	var N = canvas.width - 2 * CANVAS_BUFFER;
	UNIFORM = [];
	for (var i = 0; i < N; i++) {
		UNIFORM.push(200);
	}

	NORMAL = [];
	for (var i = 0; i < N; i++) {
		var x = (i - N / 2) / (N / 5);
		NORMAL.push(Math.round((Math.E ** (-(x ** 2) / 2)) / Math.sqrt(2 * Math.PI) * 500));
	}

	SKYLINE = [164, 164, 164, 164, 164, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 149, 149, 149, 149, 149, 149, 149, 149, 149, 149, 149, 149, 149, 149, 150, 139, 137, 137, 137, 135, 135, 135, 135, 135, 136, 137, 138, 142, 153, 153, 153, 153, 153, 154, 154, 155, 156, 156, 156, 156, 129, 132, 129, 129, 129, 129, 130, 130, 130, 130, 122, 123, 122, 121, 121, 106, 100, 101, 98, 98, 90, 103, 101, 107, 108, 122, 122, 122, 131, 131, 131, 131, 131, 131, 131, 131, 131, 132, 131, 132, 132, 134, 135, 135, 135, 135, 135, 134, 135, 134, 134, 135, 135, 135, 135, 135, 135, 135, 133, 133, 131, 130, 131, 131, 129, 124, 123, 123, 123, 123, 119, 118, 118, 118, 118, 118, 118, 118, 118, 118, 118, 118, 118, 118, 118, 118, 118, 118, 118, 119, 119, 120, 120, 120, 121, 144, 144, 144, 144, 144, 90, 89, 89, 89, 89, 89, 83, 87, 87, 87, 88, 87, 87, 87, 87, 88, 87, 87, 88, 89, 89, 89, 90, 90, 91, 109, 114, 116, 117, 118, 120, 121, 123, 128, 137, 147, 148, 148, 148, 148, 148, 148, 148, 143, 142, 113, 113, 113, 113, 113, 111, 111, 111, 112, 112, 113, 113, 114, 90, 90, 71, 62, 59, 60, 59, 59, 59, 59, 59, 60, 60, 60, 60, 61, 62, 78, 144, 144, 145, 144, 144, 144, 144, 145, 145, 145, 147, 148, 147, 147, 147, 147, 147, 147, 147, 147, 147, 147, 147, 147, 147, 150, 151, 150, 151, 152, 152, 153, 153, 153, 153, 153, 153, 153, 153, 154, 159, 159, 159, 159, 159, 159, 159, 159, 159, 159, 162, 162, 162, 156, 156, 156, 156, 153, 153, 156, 156, 156, 156, 152, 143, 143, 143, 142, 142, 141, 141, 141, 104, 104, 104, 103, 103, 103, 103, 101, 101, 100, 100, 100, 100, 100, 100, 100, 107, 141, 141, 143, 152, 154, 153, 154, 154, 153, 154, 153, 143, 143, 141, 141, 142, 141, 139, 139, 139, 139, 139, 139, 139, 138, 139, 139, 139, 139, 139, 139, 139, 139, 139, 162, 162, 161, 159, 159, 158, 155, 151, 154, 155, 155, 160, 160, 159, 92, 81, 68, 66, 66, 66, 66, 62, 64, 65, 75, 81, 101, 129, 129, 128, 128, 125, 126, 126, 125, 126, 126, 125, 125, 125, 126, 126, 127, 128, 129, 129, 124, 126, 127, 129, 129, 129, 129, 129, 129, 129, 129, 129, 129, 129, 129, 129, 129, 129, 129, 130, 114, 114, 114, 113, 111, 111, 111, 109, 109, 108, 108, 108, 108, 108, 108, 108, 108, 108, 108, 108, 108, 111, 111, 111, 111, 111, 111, 111, 111, 111, 112, 112, 112, 143, 144, 149, 154, 154, 154, 153, 153, 154, 154, 154, 154, 154, 156, 157, 157, 158, 153, 145, 145, 144, 143, 142, 142, 142, 142, 143, 144, 152, 153, 152, 152, 153, 152, 139, 139, 138, 136, 136, 135, 135, 135, 135, 135, 135, 135, 135];
}

function init_distribution() {
	init_distributions();
	distribution = [...NORMAL];
}

function setDistribution(new_dist) {
	distribution = [...new_dist];
	render_distribution();
}

function render_distribution() {
	var canvas = document.getElementById("draw_distribution");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#F1ECF4";
	ctx.fillRect(CANVAS_BUFFER, 0, distribution.length, canvas.height);
	var prev_y = -1;

	ctx.fillStyle = "#6885d0";
	for (var i = 0; i < distribution.length; i++) {
		var y = canvas.height - distribution[i];
		ctx.fillRect(i + CANVAS_BUFFER, y, 1, 1);
		if (prev_y != -1 && prev_y != y) {
			var dir = y > prev_y ? 1 : -1;
			for (var temp_y = prev_y + dir; temp_y != y; temp_y += dir) {
				ctx.fillRect(i + CANVAS_BUFFER, temp_y, 1, 1);
			}
		}

		prev_y = y;
	}
}

function register_events() {
	var canvas = document.getElementById("draw_distribution");
	var ctx = canvas.getContext("2d");

	canvas.onmousedown = function() {
		mouse_down = true;
		prev_x = -1;
		prev_y = -1;
	};

	canvas.onmouseup = function() {
		mouse_down = false;
	};

	canvas.onmouseleave = function() {
		mouse_down = false;
	};

	canvas.onmousemove = function(e) {
		var x = e.offsetX - CANVAS_BUFFER;
		x = Math.max(0, Math.min(distribution.length - 1, x));
		var y = e.offsetY;
		if (mouse_down) {
			if (prev_x != -1 && prev_x != x) {
				var slope = (y - prev_y) / (x - prev_x);
				var dir = x > prev_x ? 1 : -1;
				for (var temp_x = prev_x + dir; temp_x != x; temp_x += dir) {
					var temp_y = prev_y + slope * (temp_x - prev_x);
					distribution[temp_x] = canvas.height - Math.round(temp_y);
				}
			}

			prev_x = x;
			prev_y = y;

			distribution[x] = canvas.height - y;

			render_distribution();
		}
	};
}

function binary_search(a, v, start, end) {
	if (v < a[0]) return 0;
	if (v > a[a.length - 1]) return a.length - 1;

	if (start === undefined) {
		start = 0;
	}

	if (end === undefined) {
		end = a.length - 1;
	}

	if (start > end) {
		return -1;
	}

	var mid = Math.floor((start + end) / 2.);
	if (v > a[mid] && v < a[mid + 1]) {
		return mid + 1;
	} else if (a[mid] > v) {
		return binary_search(a, v, start, mid - 1);
	} else {
		return binary_search(a, v, mid + 1, end);
	}
}

function calc_cdf(distribution) {
	total = distribution.reduce((x, y) => x + y);
	pmf = distribution.map(x => x / total);
	cdf = [0];
	for (var i = 0; i < pmf.length; i++) {
		cdf.push(pmf[i] + cdf[cdf.length - 1]);
	}

	return cdf.slice(1);
}

function sample(n) {
	var cdf = calc_cdf(distribution);
	var res = [];
	for (var i = 0; i < n; i++) {
		res.push(binary_search(cdf, Math.random()) / cdf.length);
	}

	return res;
}

function single_sample() {
	var sampled_val = sample(1)[0];
	document.getElementById("single_sample_result").innerText = sampled_val;
}

function multi_sample() {
	var n = 1000 * (10 ** parseFloat(document.getElementById("sample_n").value));
	var res = sample(n).map(x => x * distribution.length);
	counter = [];
	for (var i = 0; i < distribution.length; i++) {
		counter.push(0);
	}

	for (var i = 0; i < res.length; i++) {
		counter[res[i]] += 1;
	}

	render_multi_sample_results(counter);
}

function render_multi_sample_results(counter) {
	var canvas = document.getElementById("multi_sample_result");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#6885d0";
	var distributionMax = distribution.reduce((x, y) => Math.max(x, y));
	var counterMax = counter.reduce((x, y) => Math.max(x, y));
	var scale = distributionMax / counterMax;

	for (var i = 0; i < counter.length; i++) {
		ctx.fillRect(i + CANVAS_BUFFER, canvas.height - counter[i] * scale, 1, counter[i] * scale);
	}
}

window.onload = function window_load() {
	register_events();
	init_distribution();
	render_distribution();
	single_sample();
	multi_sample();
}
