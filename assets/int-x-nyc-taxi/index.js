var active_button = 'btn-details';
var projection_line, clear_projection_times, update_projection_times,
    clear_projection_durations, update_projection_durations;
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

var COLOR_STOP_POINTS = [  [ 12,   7, 134, 255],
                           [ 69,   3, 158, 255],
                           [114,   0, 168, 255],
                           [155,  23, 158, 255],
                           [188,  54, 133, 255],
                           [215,  87, 107, 255],
                           [236, 120,  83, 255],
                           [250, 159,  58, 255],
                           [252, 201,  38, 255],
                           [239, 248,  33, 255]];

window.onload = function() {
    var plot_parent = document.getElementById('scatterplot');
    const margin = {top: 10, right: 30, bottom: 30, left: 60},
            width = plot_parent.clientWidth - margin.left - margin.right,
            height = plot_parent.clientHeight - margin.top - margin.bottom;

    var scatter_transform = {
        k: 1, x: 0, y: 0
    }

    var inspected_indices = new Set();

    var cmap = make_color_interpolator(COLOR_STOP_POINTS);

    const scatter_svg_parent = d3.select("#scatterplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
    var scatter_zoom = d3.zoom();

    var scatter_svg = scatter_svg_parent
        .call(scatter_zoom.on("zoom", function(e) {
            scatter_svg.attr("transform", e.transform);
            projection_line_svg.attr("transform", e.transform);
            scatter_transform.k = e.transform.k;
            scatter_transform.x = e.transform.x;
            scatter_transform.y = e.transform.y;
        }))
        .append("g");

    var projection_line_svg = scatter_svg_parent.append("g");

    var update_proportion = add_selection_proportion();

    var map_parent = document.getElementById('ny-map');

    var cursor = 'none';

    let map_width = map_parent.clientWidth - 5,
        map_height = map_parent.clientHeight - 5;
    let projection = d3.geoEqualEarth();
    let geoGenerator = d3.geoPath()
        .projection(projection);

    var map_zoom = d3.zoom();
    var map_svg_parent = d3.select("#ny-map").append('svg')
    .style("width", map_width).style("height", map_height)
    .call(map_zoom.on("zoom", function(e) {
        map_svg.attr("transform", e.transform);
        map_lines_svg.attr("transform", e.transform);
    }));

    var map_svg = map_svg_parent.append('g');
    var map_lines_svg = map_svg_parent.append('g');

    var brush = document.getElementById('brush-cursor');

    scatter_zoom.on('start', function(e) {
        if (e === undefined || e.sourceEvent == null) return;
        if (e.sourceEvent.type == 'mousedown') {
            brush.style.display = 'none';
            cursor = plot_parent.style.cursor;
            plot_parent.style.cursor = 'grab';
        }
    });

    scatter_zoom.on('end', function(e) {
        if (e === undefined || e.sourceEvent == null) return;
        if (e.sourceEvent.type == 'mouseup' && scatter_svg_parent._groups[0][0].contains(e.sourceEvent.srcElement)) {
            brush.style.display = 'block';
            plot_parent.style.cursor = cursor;
            brush.style.left = e.sourceEvent.clientX + 'px';
            brush.style.top = e.sourceEvent.clientY + 'px';
        }
    });

    d3.json("data/rides.json").then(function(data) {
        data = (data
            .filter(x => x.duration_hours <= 1)
            .filter(x => (x.pickup_longitude != x.dropoff_longitude || x.pickup_latitude != x.dropoff_latitude))
            .map(function(x, idx) {
                x.idx = idx;
                return x;
            })
        );

        data.forEach(function(d) {
            var pickup_xy = projection([d.pickup_longitude, d.pickup_latitude]);
            var dropoff_xy = projection([d.dropoff_longitude, d.dropoff_latitude]);
            var angle = Math.atan2(dropoff_xy[1] - pickup_xy[1], dropoff_xy[0] - pickup_xy[0]);

            d.direction = (Math.round((angle - Math.PI / 8) / (Math.PI / 4)) + 8) % 8;
        });

        const x = d3.scaleLinear()
        .domain([-10, 16])
        .range([ 0, width ]);
        scatter_svg.append("g");

        const y = d3.scaleLinear()
        .domain([-7, 21.5])
        .range([ height, 0]);
        scatter_svg.append("g");

        projection_line_svg.append("svg:defs").append("svg:marker")
            .attr("id", "triangle")
            .attr('viewBox', [0, 0, 20, 20])
            .attr("refX", -5)
            .attr("refY", 5)
            .attr("markerWidth", 10)
            .attr("markerHeight", 10)
            .attr("orient", "auto-start-reverse")
            .append("path")
            .attr("d", "M 0 0 10 5 0 10")
            .style("fill", "rgb(50, 50, 100)");

        projection_line = (
            projection_line_svg
                .append('line')
                .style('stroke', 'rgb(50, 50, 100)')
                .style('stroke-width', 1)
                .style('stroke-dasharray', '5,2')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', 100)
                .attr('y2', 100)
                .attr('marker-end', 'url(#triangle)')
                .attr('opacity', .7)
                .style('visibility', 'hidden')
                .attr('mode', 'first')
        );

        scatter_svg.append('g')
            .selectAll()
            .data(data)
            .join("circle")
                 .attr("cx", function (d) { return x(d.x); } )
                 .attr("cy", function (d) { return y(d.y); } )
                 .attr("r", 3)
                 .attr("data-idx", function(d) { return d.idx; });

        var lines_data = data.map(function(x, idx) {
            return {
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [
                        [x.pickup_longitude, x.pickup_latitude],
                        [x.dropoff_longitude, x.dropoff_latitude]
                    ]
                },
                idx: idx
            }
        });

        var update_days_hist = add_pop_days(data.map(x => x.pickup_day).map(x => DAYS[x]));
        var [time_hist, update_time_hist] = add_pop_time(data.map(x => x.pickup_time));
        var [duration_hist, update_duration_hist] = add_pop_duration(data.map(x => x.duration_hours * 60));
        var update_directions = add_directions(projection, data.map(x => x.direction));

        show_projection_visualizations();
        [clear_projection_times, update_projection_times] = add_projection_times();
        [clear_projection_durations, update_projection_durations] = add_projection_durations();
        hide_projection_visualizations();

        d3.json('data/nyc.geojson').then(function(bb) {
            projection.fitSize([map_width, map_height], bb);

            map_svg
            .selectAll('path')
            .data(bb.features)
            .join('path')
            .attr('d', geoGenerator)
            .attr('fill', 'rgba(255, 255, 255, 1)')
            .attr('stroke', '#888')
            .attr('stroke-width', '.7');

            (map_lines_svg
                .selectAll('path')
                .data(lines_data)
                .join('path')
                    .attr('d', geoGenerator)
                    .attr('fill', 'none')
                    .attr('stroke', 'rgba(40, 220, 190, .05)')
                    .attr('stroke-width', .2)
                    .attr('class', 'ride-line')
                    .attr('id', function(d) { return 'ride-line-' + d.idx; })
            );
        });

        var circles = document.getElementsByTagName('circle');

        var inspected_day_counts = {};
        for (var i = 0; i < DAYS.length; i++) {
            inspected_day_counts[DAYS[i]] = 0;
        }

        var inspected_time_counts = time_hist([]);
        var inspected_duration_counts = duration_hist([]);

        var inspected_direction_counts = {};
        for (var i = 0; i < 8; i++) {
            inspected_direction_counts[i] = 0;
        }

        document.getElementById('scatterplot').addEventListener('mousemove', function(e) {
            if (brush.style.display != 'block') {
                brush.style.display = 'block';
            }

            brush.style.left = e.clientX + 'px';
            brush.style.top = e.clientY + 'px';

            if (active_button == 'btn-details' || (active_button == 'btn-brush' && brush.selecting)) {
                var r = (brush.clientWidth / 2) / scatter_transform.k;
                var cr = circles[0].r.animVal.value;
                var brush_x = (e.clientX - scatter_transform.x) / scatter_transform.k - 2 * r;
                var brush_y = (e.clientY - scatter_transform.y) / scatter_transform.k - 2 * r;
                var added_ids = [];
                var removed_ids = [];

                for (var i = 0; i < circles.length; i++) {
                     var cx = circles[i].cx.animVal.value;
                     var cy = circles[i].cy.animVal.value;
                     if (Math.pow(cx - brush_x, 2) + Math.pow(cy - brush_y, 2) < Math.pow(r + cr, 2)) {
                        if (!circles[i].classList.contains('inspected')) {
                            circles[i].classList.add('inspected');
                            var data_idx = circles[i].getAttribute('data-idx');
                            inspected_indices.add(data_idx);
                            added_ids.push(data_idx);
                            var ride_line = document.getElementById('ride-line-' + data_idx);
                            if (ride_line != null) {
                                ride_line.classList.add('inspected');
                            }
                        }
                     }
                     else if (circles[i].classList.contains('inspected') && active_button == 'btn-details') {
                        circles[i].classList.remove('inspected');
                        var data_idx = circles[i].getAttribute('data-idx');
                        inspected_indices.delete(data_idx);
                        removed_ids.push(data_idx);
                        var ride_line = document.getElementById('ride-line-' + data_idx);
                        if (ride_line != null) {
                            ride_line.classList.remove('inspected');
                        }
                     }
                }

                var added_samples = added_ids.map(idx => data[idx]);
                var removed_samples = removed_ids.map(idx => data[idx]);

                combine_freqs(inspected_day_counts, count_uniques(added_samples.map(x => DAYS[x.pickup_day])), 1);
                combine_freqs(inspected_day_counts, count_uniques(removed_samples.map(x => DAYS[x.pickup_day])), -1);
                update_days_hist(calc_day_frequencies(inspected_day_counts));

                combine_hist_freqs(inspected_time_counts, time_hist(added_samples.map(x => x.pickup_time)), 1);
                combine_hist_freqs(inspected_time_counts, time_hist(removed_samples.map(x => x.pickup_time)), -1);
                update_time_hist(calc_hist_frequencies(inspected_time_counts));

                combine_hist_freqs(inspected_duration_counts,
                                   duration_hist(added_samples.map(x => x.duration_hours * 60)), 1);
                combine_hist_freqs(inspected_duration_counts,
                                   duration_hist(removed_samples.map(x => x.duration_hours * 60)), -1);
                update_duration_hist(calc_hist_frequencies(inspected_duration_counts));

                combine_freqs(inspected_direction_counts, count_uniques(added_samples.map(x => x.direction)), 1);
                combine_freqs(inspected_direction_counts, count_uniques(removed_samples.map(x => x.direction)), -1);
                update_directions(calc_direction_frequencies(inspected_direction_counts));

                update_proportion(inspected_indices.size / circles.length);

                if (inspected_indices.size > 0 && brush.selecting) {
                    document.getElementById('btn-projection').removeAttribute('disabled');
                } else {
                    document.getElementById('btn-projection').setAttribute('disabled', true);
                }
            } else if (active_button == 'btn-projection' && projection_line.attr('mode') == 'second') {
                var mouse_x = (e.offsetX - scatter_transform.x) / scatter_transform.k;
                var mouse_y = (e.offsetY - scatter_transform.y) / scatter_transform.k;
                projection_line.attr('x2', mouse_x);
                projection_line.attr('y2', mouse_y);
            }
        });

        document.getElementById('scatterplot').addEventListener('mouseenter', function(e) {
            brush.style.display = 'block';
        });

        document.getElementById('scatterplot').addEventListener('mouseleave', function(e) {
            brush.style.display = 'none';
            if (active_button != 'btn-details') return;
            var should_update = false;
            for (var i = 0; i < circles.length; i++) {
                if (circles[i].classList.contains('inspected')) {
                    circles[i].classList.remove('inspected');
                    var data_idx = circles[i].getAttribute('data-idx');
                    inspected_indices.delete(data_idx);
                    document.getElementById('ride-line-' + data_idx).classList.remove('inspected');
                    should_update = true;
                }
            }

            if (should_update) {
                inspected_day_counts = {};
                for (var i = 0; i < DAYS.length; i++) {
                    inspected_day_counts[DAYS[i]] = 0;
                }

                inspected_time_counts = time_hist([]);
                inspected_duration_counts = duration_hist([]);

                inspected_direction_counts = {};
                for (var i = 0; i < 8; i++) {
                    inspected_direction_counts[i] = 0;
                }

                update_days_hist(calc_day_frequencies(inspected_day_counts));
                update_time_hist(calc_hist_frequencies(inspected_time_counts));
                update_duration_hist(calc_hist_frequencies(inspected_duration_counts));
                update_directions(calc_direction_frequencies(inspected_direction_counts));
                update_proportion(0);

                document.getElementById('btn-projection').setAttribute('disabled', true);
            }
        });

        document.getElementById('scatterplot').addEventListener('click', function(e) {
            if (active_button == 'btn-projection') {
                var click_x = (e.offsetX - scatter_transform.x) / scatter_transform.k;
                var click_y = (e.offsetY - scatter_transform.y) / scatter_transform.k;
                if (projection_line.attr('mode') == 'first') {
                    (
                        projection_line
                            .attr('x1', click_x)
                            .attr('y1', click_y)
                            .attr('x2', click_x)
                            .attr('y2', click_y)
                            .style('visibility', 'visible')
                            .attr('mode', 'second')
                    );
                    projection_line;
                } else {
                    (
                        projection_line
                            .attr('x2', click_x)
                            .attr('y2', click_y)
                            .attr('mode', 'first')
                    );

                    var x1 = projection_line.attr('x1');
                    var y1 = projection_line.attr('y1');
                    var x2 = projection_line.attr('x2');
                    var y2 = projection_line.attr('y2');
                    var norm = Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);

                    var inspected_list = [...inspected_indices];
                    var inspected_projection_scores = [];
                    for (var i = 0; i < inspected_list.length; i++) {
                        var idx = inspected_list[i];
                        var cx = circles[idx].cx.animVal.value;
                        var cy = circles[idx].cy.animVal.value;
                        var u = ((x1 - x2) * (x1 - cx) + (y1 - y2) * (y1 - cy)) / norm;
                        inspected_projection_scores.push(u);
                    }

                    var max_score = Math.max(...inspected_projection_scores)
                    var min_score = Math.min(...inspected_projection_scores)

                    var time_points = [];
                    var duration_points = [];
                    for (var i = 0; i < inspected_list.length; i++) {
                        var idx = inspected_list[i];
                        var u = (inspected_projection_scores[i] - min_score) / (max_score - min_score);
                        var color = cmap(u);
                        circles[idx].setAttribute('style', 'fill: ' + color + ';');
                        var ride_line = document.getElementById('ride-line-' + idx);
                        if (ride_line != null) {
                            ride_line.setAttribute('style', 'stroke: ' + color + ';');
                        }

                        time_points.push({x: u, y: data[idx].pickup_time});
                        duration_points.push({x: u, y: data[idx].duration_hours});
                    }

                    update_projection_times(time_points);
                    update_projection_durations(duration_points);
                }
            }
        });

        document.getElementById('btn-clear-selection').addEventListener('click', function() {
            if (active_button == 'btn-projection') {
                document.getElementById('btn-brush').click();
            }

            for (var i = 0; i < circles.length; i++) {
                if (circles[i].classList.contains('inspected')) {
                    circles[i].classList.remove('inspected');
                    var data_idx = circles[i].getAttribute('data-idx');
                    inspected_indices.delete(data_idx);
                    document.getElementById('ride-line-' + data_idx).classList.remove('inspected');
                    should_update = true;
                }
            }

            inspected_day_counts = {};
            for (var i = 0; i < DAYS.length; i++) {
                inspected_day_counts[DAYS[i]] = 0;
            }

            inspected_time_counts = time_hist([]);
            inspected_duration_counts = duration_hist([]);

            inspected_direction_counts = {};
            for (var i = 0; i < 8; i++) {
                inspected_direction_counts[i] = 0;
            }

            update_days_hist(calc_day_frequencies(inspected_day_counts));
            update_time_hist(calc_hist_frequencies(inspected_time_counts));
            update_duration_hist(calc_hist_frequencies(inspected_duration_counts));
            update_directions(calc_direction_frequencies(inspected_direction_counts));
            update_proportion(0);

            document.getElementById('btn-projection').setAttribute('disabled', true);
        });

        document.getElementById('btn-projection').addEventListener('click', function() {
            hide_brush();
        });

        document.getElementById('btn-clear-projection').addEventListener('click', function(e) {
            projection_line.style('visibility', 'hidden');
            e.stopPropagation();
            projection_line.attr('mode', 'first');
            resetElementStyle(document.querySelectorAll('.inspected'));
            clear_projection_times();
            clear_projection_durations();
        });
    });

    var selectable_buttons = document.getElementsByClassName('selectable');
    for (var i = 0; i < selectable_buttons.length; i++) {
        selectable_buttons[i].addEventListener('click', function(e) {
            for (var j = 0; j < selectable_buttons.length; j++) {
                selectable_buttons[j].classList.remove('selected');
            }

            this.classList.add('selected');
            active_button = this.id;
            if (active_button != 'btn-projection') {
                show_brush();
                projection_line.style('visibility', 'hidden');
                resetElementStyle(document.querySelectorAll('.inspected'));
                clear_projection_times();
                clear_projection_durations();
                hide_projection_visualizations();
            } else {
                show_projection_visualizations();
            }

            e.stopPropagation();
        });
    }

    document.getElementById('btn-reset').addEventListener('click', function() {
         scatter_svg_parent.call(scatter_zoom.transform, d3.zoomIdentity);
    });

    document.getElementById('btn-reset-map').addEventListener('click', function() {
        map_svg_parent.call(map_zoom.transform, d3.zoomIdentity.translate(-364.75, -184.838).scale(2.31));
    });

    document.addEventListener('keydown', function(e) {
        if (active_button == 'btn-brush' &&
            (e.code == 'MetaLeft' || e.code == 'MetaRight' || e.code == 'ControlLeft' || e.code == 'ControlRight')) {
                brush.classList.add('selecting');
                brush.selecting = true;
            }
    });

    document.addEventListener('keyup', function(e) {
        if (active_button == 'btn-brush' &&
            (e.code == 'MetaLeft' || e.code == 'MetaRight' || e.code == 'ControlLeft' || e.code == 'ControlRight')) {
                brush.classList.remove('selecting');
                brush.selecting = false;
            }
    });

    map_svg_parent.call(map_zoom.transform, d3.zoomIdentity.translate(-364.75, -184.838).scale(2.31));
}

function hide_brush() {
    document.getElementById('brush-cursor').classList.add('hidden');
    document.getElementById('scatterplot').classList.add('projection');
}

function show_brush() {
    document.getElementById('brush-cursor').classList.remove('hidden');
    document.getElementById('scatterplot').classList.remove('projection');
}

function show_projection_visualizations() {
    document.getElementById('visualizations').classList.add('hidden');
    document.getElementById('projection-visualizations').classList.remove('hidden');
}

function hide_projection_visualizations() {
    document.getElementById('visualizations').classList.remove('hidden');
    document.getElementById('projection-visualizations').classList.add('hidden');
}

function add_pop_days(days) {
    var day_counts = calc_day_frequencies(count_uniques(days));

    var days_bar_parent = document.getElementById('pop-day');
    var margin = {top: 15, right: 15, bottom: 30, left: 35},
        width = days_bar_parent.clientWidth - margin.left - margin.right,
        height = days_bar_parent.clientHeight - margin.top - margin.bottom;

    var svg = d3.select("#pop-day")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleBand()
        .range([ 0, width ])
        .domain(day_counts.map(function(d) { return d.day; }))
        .padding(0.2);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    var y = d3.scaleLinear()
        .domain([0, 1])
        .range([ height, 0]);
        svg.append("g")
            .call(d3.axisLeft(y).tickFormat(d3.format('.0%')));

    svg.selectAll()
        .data(day_counts)
            .enter()
            .append("rect")
            .attr("x", function(d) { return x(d.day); })
            .attr("y", function(d) { return y(d.count); })
            .attr("width", x.bandwidth())
            .attr("height", function(d) { return height - y(d.count); })
            .attr("fill", "rgba(40, 220, 190, 1)");

    var inspected_day_counts = DAYS.map(x => ({day: x, count: 0}));

    var inspected_nodes = svg.selectAll()
        .data(inspected_day_counts)
        .enter()
        .append("rect")
        .attr("x", function(d) { return x(d.day); })
        .attr("y", function(d) { return y(d.count); })
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return height - y(d.count); })
        .attr("fill", "rgba(220, 40, 220, .6)");

    function update_inspected_nodes(day_counts) {
        if (day_counts === undefined) var day_counts = inspected_day_counts;

        inspected_nodes.data(day_counts)
            .attr("x", function(d) { return x(d.day); })
            .attr("y", function(d) { return y(d.count); })
            .attr("width", x.bandwidth())
            .attr("height", function(d) { return height - y(d.count); });
    }

    return update_inspected_nodes;
}

function add_pop_time(times) {
    var times_hist_parent = document.getElementById('pop-time');
    var margin = {top: 15, right: 15, bottom: 30, left: 35},
        width = times_hist_parent.clientWidth - margin.left - margin.right,
        height = times_hist_parent.clientHeight - margin.top - margin.bottom;

    var svg = d3.select("#pop-time")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleLinear()
        .domain([0, Math.max(...times)])
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(7));

    var histogram = d3.histogram()
        .domain(x.domain())
        .thresholds(x.ticks(48));

    var bins = histogram(times);

    var y = d3.scaleLinear()
        .range([height, 0]);
        y.domain([0, .15]);
    svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d3.format('.0%')));

    svg.selectAll()
        .data(bins)
        .enter()
            .append("rect")
            .attr("x", 1)
            .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length / times.length) + ")"; })
            .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
            .attr("height", function(d) { return height - y(d.length / times.length); })
            .style("fill", "rgba(40, 220, 190, 1)");

    var inspected_bins = histogram([]);
    var inspected_nodes = svg.selectAll()
        .data(inspected_bins)
        .enter()
            .append("rect")
            .attr("x", 1)
            .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
            .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
            .attr("height", function(d) { return height - y(d.length); })
            .style("fill", "rgba(220, 40, 220, .6)");

    function update_inspected_nodes(counts) {
        inspected_nodes.data(counts)
            .attr("x", 1)
            .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.freq) + ")"; })
            .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
            .attr("height", function(d) { return height - y(d.freq); })
    }

    return [histogram, update_inspected_nodes];
}

function add_pop_duration(durations) {
    var durations_hist_parent = document.getElementById('pop-duration');
    var margin = {top: 15, right: 15, bottom: 30, left: 35},
        width = durations_hist_parent.clientWidth - margin.left - margin.right,
        height = durations_hist_parent.clientHeight - margin.top - margin.bottom;

    var svg = d3.select("#pop-duration")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleLinear()
        .domain([0, Math.max(...durations)])
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(7));

    var histogram = d3.histogram()
        .domain(x.domain())
        .thresholds(x.ticks(25));

    var bins = histogram(durations);

    var y = d3.scaleLinear()
        .range([height, 0]);
        y.domain([0, .2]);
    svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d3.format('.0%')));

    svg.selectAll()
        .data(bins)
        .enter()
            .append("rect")
            .attr("x", 1)
            .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length / durations.length) + ")"; })
            .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
            .attr("height", function(d) { return height - y(d.length / durations.length); })
            .style("fill", "rgba(40, 220, 190, 1)");

    var inspected_bins = histogram([]);
    var inspected_nodes = svg.selectAll()
        .data(inspected_bins)
        .enter()
            .append("rect")
            .attr("x", 1)
            .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
            .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
            .attr("height", function(d) { return height - y(d.length); })
            .style("fill", "rgba(220, 40, 220, .6)");

    function update_inspected_nodes(counts) {
        inspected_nodes.data(counts)
            .attr("x", 1)
            .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.freq) + ")"; })
            .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
            .attr("height", function(d) { return height - y(d.freq); });
    }

    return [histogram, update_inspected_nodes];
}

function add_directions(projection, directions) {
    var directions_parent = document.getElementById('pop-direction');
    var margin = {top: 5, right: 5, bottom: 10, left: 10},
        width = directions_parent.clientWidth - margin.left - margin.right,
        height = directions_parent.clientHeight - margin.top - margin.bottom;

    var svg = d3.select("#pop-direction")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr('viewBox', '0 0 100 100')
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var direction_counts = calc_direction_frequencies(count_uniques(directions));
    (svg.selectAll()
        .data(direction_counts)
        .join('path')
            .attr('d', make_direction_path_generator(width, height))
            .attr('fill', 'rgba(40, 220, 190, 1)')
    );

    var inspected_direction_counts = calc_direction_frequencies(count_uniques([]));
    var inspected_nodes = (svg.selectAll()
        .data(inspected_direction_counts)
        .join('path')
            .attr('d', make_direction_path_generator(width, height))
            .attr('fill', 'rgba(220, 40, 220, .6)')
    );

    function update_directions(counts) {
        inspected_nodes
            .data(counts)
            .attr('d', make_direction_path_generator(width, height));
    }

    return update_directions;
}

function add_projection_times() {
    var projection_times_parent = document.getElementById('time-scatterplot');
    var margin = {top: 15, right: 15, bottom: 20, left: 20},
        width = projection_times_parent.clientWidth - margin.left - margin.right,
        height = projection_times_parent.clientHeight - margin.top - margin.bottom;

    var svg = d3.select("#time-scatterplot")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    function clear_time_scatter() {
        svg.selectAll("*").remove();
    }

    function update_time_scatter(points) {
        clear_time_scatter();

        var x = d3.scaleLinear()
            .domain([0, 1])
            .range([ 0, width ]);

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks([]));

        var y = d3.scaleLinear()
            .domain([0, 24])
            .range([ height, 0]);

        svg.append("g")
            .call(d3.axisLeft(y));

        svg.append('g')
            .selectAll("dot")
            .data(points)
            .enter()
                .append("circle")
                .attr("cx", function (d) { return x(d.x); } )
                .attr("cy", function (d) { return y(d.y); } )
                .attr("r", 2);
    }

    return [clear_time_scatter, update_time_scatter];
}

function add_projection_durations() {
    var projection_durations_parent = document.getElementById('duration-scatterplot');
    var margin = {top: 15, right: 15, bottom: 20, left: 30},
        width = projection_durations_parent.clientWidth - margin.left - margin.right,
        height = projection_durations_parent.clientHeight - margin.top - margin.bottom;

    var svg = d3.select("#duration-scatterplot")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    function clear_duration_scatter() {
        svg.selectAll("*").remove();
    }

    function update_duration_scatter(points) {
        clear_duration_scatter();

        var x = d3.scaleLinear()
            .domain([0, 1])
            .range([ 0, width ]);

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks([]));

        var y = d3.scaleLinear()
            .domain([0, Math.max(...points.map(p => p.y))])
            .range([ height, 0]);

        svg.append("g")
            .call(d3.axisLeft(y));

        svg.append('g')
            .selectAll("dot")
            .data(points)
            .enter()
                .append("circle")
                .attr("cx", function (d) { return x(d.x); } )
                .attr("cy", function (d) { return y(d.y); } )
                .attr("r", 2);
    }

    return [clear_duration_scatter, update_duration_scatter];
}

function count_uniques(values) {
    var counts = {};
    for (var i = 0; i < values.length; i++) {
        if (!(values[i] in counts)) {
            counts[values[i]] = 0;
        }

        counts[values[i]] += 1;
    }

    return counts;
}

function calc_day_frequencies(day_counts) {
    var s = DAYS.map(x => day_counts[x]).reduce((x, y) => x + y);
    return DAYS.map(x => ({day: x, count: s > 0 ? day_counts[x] / s : 0}));
}

function calc_direction_frequencies(counts) {
    var directions = [...Array(8).keys()];
    var s = directions.map(x => counts[x]).reduce((x, y) => x + y);
    var relative_counts = directions.map(x => s > 0 ? Math.pow(counts[x] / s, 0.7) : 0)
    s = directions.map(x => relative_counts[x]).reduce((x, y) => x + y);
    return directions.map(x => ({direction: x, count: s > 0 ? relative_counts[x] / s : 0}));
}

function calc_hist_frequencies(counts) {
    var s = counts.map(x => x.length).reduce((x, y) => x + y);
    counts.forEach(function(x) {
        x.freq = s > 0 ? x.length / s : 0;
    });

    return counts;
}

function combine_freqs(a, b, sign) {
    for (var k in a) {
        var b_val = 0;
        if (k in b) b_val = b[k];
        a[k] += sign * b_val;
    }
}

function combine_hist_freqs(a, b, sign) {
    for (var i = 0; i < a.length; i++) {
        a[i].length += sign * b[i].length;
    }
}

function make_direction_path_generator(width, height) {
    var x_factor = 1, y_factor = 1;
    function generate_direction_path(direction) {
        return make_arrow_coordinates(direction.direction, 150 * direction.count, x_factor, y_factor);
    }

    return generate_direction_path;
}

function make_arrow_coordinates(direction, radius_factor, x_factor, y_factor) {
    var angles = [-.1, -.2, 0, .2, .1].map(x => x + direction * Math.PI / 4);
    var radii = [.65, .6, 1, .6, .65].map(x => x * radius_factor);
    var points = [];
    for (var i = 0; i < angles.length; i++) {
        points.push([50 + Math.cos(angles[i]) * radii[i] * x_factor,
                     50 + Math.sin(angles[i]) * radii[i] * y_factor]);
    }

    return (
        "M 50 50 "
        + points.map(p => " L " + p[0] + " " + p[1]).reduce((x, y) => x + y)
        + " Z"
    );
}

function add_selection_proportion() {
    var percentage_parent = document.getElementById('selection-proportion');
    var percentage_width = percentage_parent.clientWidth - 5,
        percentage_height = percentage_parent.clientHeight - 5;
    var percentage_svg_parent = d3.select('#selection-proportion')
        .append('svg')
        .attr('width', percentage_width + 5)
        .attr('height', percentage_height + 5);

    var percentage_svg = percentage_svg_parent.append('g');

    percentage_svg.selectAll()
        .data([1])
        .enter()
            .append('rect')
                .attr('x', 2.5)
                .attr('y', 2.5)
                .attr('width', function(d) { return percentage_width * d; })
                .attr('height', percentage_height)
                .attr('fill', 'rgba(40, 220, 190, .8)');


    var inspected_percentage = percentage_svg.selectAll()
        .data([0])
        .enter()
            .append('rect')
                .attr('x', 2.5)
                .attr('y', 2.5)
                .attr('width', function(d) { return percentage_width * d; })
                .attr('height', percentage_height)
                .attr('fill', 'rgba(220, 40, 220, .6)');

    function update_inspected(percentage) {
        inspected_percentage.data([percentage])
            .attr('width', function(d) { return percentage_width * d; });
    }

    return update_inspected;
}

function make_color_interpolator(colors) {
    function interpolate(x) {
        var idx_upper = Math.ceil(x * (colors.length - 1));
        var idx_lower = Math.floor(x * (colors.length - 1));
        var r = colors[idx_lower][0], g = colors[idx_lower][1], b = colors[idx_lower][2];
        if (idx_upper != idx_lower) {
            var d = x * (colors.length - 1) - idx_lower;
            var c1 = colors[idx_lower], c2 = colors[idx_upper];
            r = Math.round((1 - d) * c1[0] + d * c2[0]);
            g = Math.round((1 - d) * c1[1] + d * c2[1]);
            b = Math.round((1 - d) * c1[2] + d * c2[2]);
        }

        return 'rgb(' + r + ', ' + g + ', ' + b + ')';
    }

    return interpolate;
}

function resetElementStyle(elements) {
    elements.forEach(x => x.setAttribute('style', ''));
}