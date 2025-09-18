function linspace(a, b, n) {
    return [... new Array(n)].map((_, i) => i / n).map(x => x * (b - a) + a);
}

function smooth(arrays, w, aroundIdx, maxDepth, circular) {
    if (maxDepth === undefined) maxDepth = 10;
    if (circular === undefined) circular = false;
    const [x, y] = arrays;
    const w_halfsize = Math.floor(w.length / 2);

    for (var i = 0; i < arrays.length; i++) {
        const array = arrays[i];
        const array_ref = [...array];
        const first = array[0];
        const last = array[array.length - 1];

        if (!circular) {
            for (var j = Math.max(1, aroundIdx - w_halfsize); j < Math.min(array.length - 1, aroundIdx + w_halfsize); j++) {
                array[j] = 0;
                for (var k = -w_halfsize; k <= w_halfsize; k++) {
                    array[j] += w[k + w_halfsize] * (
                        j + k < 0 ? first :
                         j + k >= array_ref.length ? last :
                          array_ref[j + k]
                    );
                }
            }
        } else {
            for (var j = -w_halfsize; j <= w_halfsize; j++) {
                let arrayIdx = aroundIdx + j;
                if (arrayIdx < 0) arrayIdx += array_ref.length;
                else arrayIdx = arrayIdx % array_ref.length;
                array[arrayIdx] = 0;
                for (var k = -w_halfsize; k <= w_halfsize; k++) {
                    array[arrayIdx] += w[k + w_halfsize] * (
                        arrayIdx + k < 0 ? array_ref[arrayIdx + k + array_ref.length] :
                         arrayIdx + k >= array_ref.length ? array_ref[(arrayIdx + k) % array_ref.length] :
                          array_ref[arrayIdx + k]
                    );
                }
            }
        }

    }

    if (maxDepth > 0) {
        for (var j = 1; j < x.length - 1; j++) {
            if (calculateAngle(x, y, j) * 180 / Math.PI < 130) {
                smooth([x, y], w, j, maxDepth - 1, circular);
                return;
            }
        }
    }
}

function solveQuadraticPositive(a, b, c, reduction) {
    if (reduction === undefined) reduction = Math.max;
    const discriminant_sq = Math.pow(b, 2) - 4 * a * c;
    if (discriminant_sq < 0) return [];

    let res = [];
    const x1 = (-b + Math.sqrt(discriminant_sq)) / (2 * a);
    if (x1 > 0) res.push(x1);
    const x2 = (-b - Math.sqrt(discriminant_sq)) / (2 * a);
    if (x2 > 0) res.push(x2);

    if (res.length == 2) return [reduction(...res)];

    return res;
}

function calculateAngle(x, y, i) {
    const a = [x[i + 1] - x[i], y[i + 1] - y[i]];
    const b = [x[i - 1] - x[i], y[i - 1] - y[i]];
    const normedProduct = (a[0] * b[0] + a[1] * b[1]) / (Math.sqrt(a[0] * a[0] + a[1] * a[1]) * Math.sqrt(b[0] * b[0] + b[1] * b[1]));
    return Math.acos(normedProduct);
}

function chooseNearestCollision(collisions) {
    let res = null;
    for (var i = 0; i < collisions.length; i++) {
        if (res === null || res['t'] > collisions[i]['t']) {
            res = collisions[i];
        }
    }

    return res;
}

function lineIntersection(x0, y0, x1, y1, cx, cy, vx, vy, r, TIME_MODIFIER, color) {
    const A = y1 - y0;
    const B = x0 - x1;
    const C = (x1 - x0) * y1 + (y0 - y1) * x1;

    const w = [cx - (x0 + x1) / 2, cy - (y0 + y1) / 2];
    const sign = Math.sign(dotProduct([A, B], w));
    if (dotProduct([A * sign, B * sign], [vx, vy]) >= 0) {
        return [];
    }

    const options = [
        (r * Math.sqrt(Math.pow(A, 2) + Math.pow(B, 2)) - A * cx - B * cy - C) / (A * vx + B * vy),
        (-r * Math.sqrt(Math.pow(A, 2) + Math.pow(B, 2)) - A * cx - B * cy - C) / (A * vx + B * vy)
    ];

    const minx = Math.min(x0, x1);
    const maxx = Math.max(x0, x1);
    const miny = Math.min(y0, y1);
    const maxy = Math.max(y0, y1);

    let res = [];
    for (var i = 0; i < options.length; i++) {
        const t = options[i];

        const tempx = cx + vx * t;
        const tempy = cy + vy * t;

        const px = (-C - B * (tempy - B / A * tempx)) / (A + Math.pow(B,  2) / A);
        const py = B / A * px + tempy - B / A * tempx;

        if (t > 0 && px >= minx && px <= maxx && py >= miny && py <= maxy) {
            res.push(t);
        }
    }

    res = res.map(t => t / TIME_MODIFIER);

    const magnitude = Math.sqrt(Math.pow(A, 2) + Math.pow(B, 2));
    const normal = [A * sign / magnitude, B * sign / magnitude];

    res = res.map(t => {return {
        t: t,
        color: color,
        normal: normal,
        type: "line"
    };});

    return res;
}

function dotProduct(u, v) {
    return u[0] * v[0] + u[1] * v[1];
}

function pointCollision(cx, cy, vx, vy, x0, y0, r, TIME_MODIFIER, color) {
    const times = solveQuadraticPositive(
        Math.pow(vx, 2) + Math.pow(vy, 2),
        2 * (cx * vx - vx * x0 + cy * vy - vy * y0),
        (
            Math.pow(cx, 2) + Math.pow(x0, 2) - 2 * cx * x0
            + Math.pow(cy, 2) + Math.pow(y0, 2) - 2 * cy * y0
             - Math.pow(r, 2)
        ),
        Math.min
    ).filter(x => x > 0).filter(t => {
        return dotProduct([cx - x0, cy - y0], [vx, vy]) < 0;
    }).map(t => t / TIME_MODIFIER);

    function calcNormal(t) {
        const px = cx + vx * t * TIME_MODIFIER, py = cy + vy * t * TIME_MODIFIER;
        const dx = px - x0, dy = py - y0;
        const magnitude = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
        return [dx / magnitude, dy / magnitude];
    }

    return times.map(t => {
        return {
            t: t,
            color: color,
            normal: calcNormal(t),
            type: "point"
        };
    });
}

function totalPathDistance(x, y) {
    let res = 0;
    for (var i = 0; i < x.length - 1; i++) {
        res += Math.sqrt(Math.pow(x[i + 1] - x[i], 2) + Math.pow(y[i + 1] - y[i], 2));
    }

    return res;
}

function swap2opt(x, y, i, j) {
    const newX = [], newY = [];
    for (var idx = 0; idx <= i; idx++) {
        newX.push(x[idx]);
        newY.push(y[idx]);
    }

    for (var idx = j; idx > i; idx--) {
        newX.push(x[idx]);
        newY.push(y[idx]);
    }

    for (var idx = j + 1; idx < x.length; idx++) {
        newX.push(x[idx]);
        newY.push(y[idx]);
    }

    return [newX, newY];
}

function resolveKnots(x, y) {
    let hasImproved = true;
    while (hasImproved) {
        hasImproved = false;
        const currDist = totalPathDistance(x, y);
        for (var i = 0; i < x.length - 1; i++) {
            for (var j = i + 1; j < x.length; j++) {
                const [newX, newY] = swap2opt(x, y, i, j);
                const newDist = totalPathDistance(newX, newY);
                if (newDist < currDist) {
                    [x, y] = [newX, newY];
                    hasImproved = true;
                    break;
                }
            }

            if (hasImproved) break;
        }
    }

    return [x, y];
}

function generateHamming(M) {
    const n = [... new Array(M)].map((_, i) => i);
    const w = n.map(x => .54 - .46 * Math.cos(2 * Math.PI * x / (M - 1)));
    const total = w.reduce((a, b) => a + b);
    return w.map(x => x / total);
}

window.onload = function() {
    const canvas = document.querySelector('canvas');
    const size = `${Math.min(Math.round(.7 * screen.width), 600)}px`;
    console.log(size);
    canvas.setAttribute('width', size);
    canvas.setAttribute('height', size);
    const ctx = canvas.getContext('2d');

    const W = canvas.width, H = canvas.height;
    const R = .75 * W / 4;
    const N = 50;
    const ALPHA = .95;
    const r = Math.floor(R / 4.5);
    let blackx = W / 2, blacky = H / 2 - R, whitex = W / 2, whitey = H / 2 + R;
    let blackvx = 0, blackvy = 0, whitevx = 0, whitevy = 0;
    let TIME_MODIFIER = 200;
    let IMPACT_STRENGTH = 0;
    const N_MOTION_BLUR_FIGURES = 5;

    /* const WINDOW = [
        0.015, 0.031, 0.073, 0.124, 0.166,
        0.182, 0.166, 0.124, 0.073, 0.031, 0.015
    ]; */

     /* const WINDOW = [0.00735294, 0.00942224, 0.01542759, 0.02478114, 0.0365673 ,
       0.04963235, 0.06269741, 0.07448357, 0.08383712, 0.08984246,
       0.09191176, 0.08984246, 0.08383712, 0.07448357, 0.06269741,
       0.04963235, 0.0365673 , 0.02478114, 0.01542759, 0.00942224,
       0.00735294]; */

     let WINDOW = null;

    /*const WINDOW = [0.00295421, 0.00308815, 0.00348788, 0.00414708, 0.00505535,
       0.00619838, 0.00755814, 0.00911318, 0.01083898, 0.01270833,
       0.01469173, 0.01675792, 0.01887431, 0.02100752, 0.02312391,
       0.0251901 , 0.0271735 , 0.02904285, 0.03076865, 0.03232369,
       0.03368345, 0.03482648, 0.03573476, 0.03639395, 0.03679368,
       0.03692762, 0.03679368, 0.03639395, 0.03573476, 0.03482648,
       0.03368345, 0.03232369, 0.03076865, 0.02904285, 0.0271735 ,
       0.0251901 , 0.02312391, 0.02100752, 0.01887431, 0.01675792,
       0.01469173, 0.01270833, 0.01083898, 0.00911318, 0.00755814,
       0.00619838, 0.00505535, 0.00414708, 0.00348788, 0.00308815,
       0.00295421];*/

    function prepareOnCollision(x, y, indices, checkBoundaries, circular) {
        if (checkBoundaries === undefined) checkBoundaries = true;
        if (circular === undefined) circular = false;
        function onCollision(normal, magnitude) {
            for (var i = 0; i < indices.length; i++) {
                const idx = indices[i];
                x[idx] -= normal[0] * magnitude;
                y[idx] -= normal[1] * magnitude;

                if (checkBoundaries) {
                    const d = Math.sqrt(Math.pow(x[idx] - W / 2, 2) + Math.pow(y[idx] - H / 2, 2));
                    if (d > 2 * R) {
                        x[idx] = W / 2 + 2 * R / d * (x[idx] - W / 2);
                        y[idx] = H / 2 + 2 * R / d * (y[idx] - H / 2);
                    }
                }
            }

            smooth([x, y], WINDOW, indices[0], 10, circular);

            if (!circular) {
                let [newX, newY] = resolveKnots(x, y);
                for (var i = 0; i < x.length; i++) {
                    x[i] = newX[i];
                    y[i] = newY[i];
                }
            }
        }

        return onCollision;
    }

    const theta2 = linspace(-Math.PI / 2, Math.PI / 2, N).reverse();
    const theta1 = linspace(Math.PI / 2, 1.5 * Math.PI, N);

    const x1 = theta1.map(alpha => W / 2 + R * Math.cos(alpha));
    const y1 = theta1.map(alpha => H / 2 + R + R * Math.sin(alpha));

    const x2 = theta2.map(alpha => W / 2 + R * Math.cos(alpha));
    const y2 = theta2.map(alpha => H / 2 - R + R * Math.sin(alpha));

    const x = [...x1, ...x2];
    const y = [...y1, ...y2];

    const xShadow = [...x];
    const yShadow = [...y];

    const thetaFull = linspace(0, 2 * Math.PI, N * 4);
    const xCircleShadow = thetaFull.map(alpha => W / 2 + 2 * R * Math.cos(alpha));
    const yCircleShadow = thetaFull.map(alpha => H / 2 + 2 * R * Math.sin(alpha));

    let prevTime = null;
    let nextCollision = null;

    function findCircleCollisions(x0, y0, vx, vy, color) {
        const cx = W / 2;
        const cy = H / 2;
        const times = solveQuadraticPositive(
            Math.pow(vx, 2) + Math.pow(vy, 2),
            2 * (x0 * vx - vx * cx + y0 * vy - vy * cy),
            (
                Math.pow(x0, 2) + Math.pow(cx, 2) - 2 * x0 * cx
                + Math.pow(y0, 2) + Math.pow(cy, 2) - 2 * y0 * cy
                 - Math.pow((2 * R - r), 2)
            )
        ).map(t => t / TIME_MODIFIER);

        function calcNormal(t) {
            const px = x0 + vx * t * TIME_MODIFIER, py = y0 + vy * t * TIME_MODIFIER;
            const dx = cx - px, dy = cy - py;
            const magnitude = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
            return [dx / magnitude, dy / magnitude];
        }

        function calcIdx(t) {
            const px = x0 + vx * t * TIME_MODIFIER, py = y0 + vy * t * TIME_MODIFIER;
            const dx = px - cx, dy = py - cy;
            let angle = Math.atan2(dy, dx);
            if (angle < 0) angle += 2 * Math.PI;
            return Math.floor(N * 4 * angle / (2 * Math.PI));
        }

        return times.map(t => {
            return {
                t: t,
                color: color,
                normal: calcNormal(t),
                type: "circle",
                onCollision: prepareOnCollision(xCircleShadow, yCircleShadow, [calcIdx(t)], false, true)
            };
        });
    }

    function findLineCollisions(x0, y0, vx, vy, color) {
        let res = [];
        for (var i = 0; i < x.length - 1; i++) {
            const newRes = lineIntersection(x[i], y[i], x[i + 1], y[i + 1], x0, y0, vx, vy, r, TIME_MODIFIER, color);
            newRes.forEach(collision => {
                collision.onCollision = prepareOnCollision(x, y, [i, i + 1]);
            });

            res = [...res, ...newRes];
        }

        return res;
    }

    function findPointCollisions(x0, y0, vx, vy, color) {
        let res = [];
        for (var i = 0; i < x.length; i++) {
            const newRes = pointCollision(x0, y0, vx, vy, x[i], y[i], r, TIME_MODIFIER, color);
            newRes.forEach(collision => {
                collision.onCollision = prepareOnCollision(x, y, [i]);
            });

            res = [...res, ...newRes];
        }

        return res;
    }

    function render(timestamp) {
        const   keyframeTimes = {white: [0], black: [0]},
                keyframesX = {white: [whitex], black: [blackx]},
                keyframesY = {white: [whitey], black: [blacky]};
        if (prevTime !== null) {
            let dt = (timestamp - prevTime) / 1000;
            if (dt > 1) {
                prevTime = timestamp;
                requestAnimationFrame(render);
                return;
            }

            let totalTime = 0;

            while (dt > 0) {
                if (nextCollision === null && (blackvx != 0 || blackvy != 0)) {
                    nextCollision = chooseNearestCollision(
                        [
                            ...findCircleCollisions(blackx, blacky, blackvx, blackvy, 'black'),
                            ...findCircleCollisions(whitex, whitey, whitevx, whitevy, 'white'),
                            ...findLineCollisions(whitex, whitey, whitevx, whitevy, 'white'),
                            ...findLineCollisions(blackx, blacky, blackvx, blackvy, 'black'),
                            ...findPointCollisions(whitex, whitey, whitevx, whitevy, 'white'),
                            ...findPointCollisions(blackx, blacky, blackvx, blackvy, 'black'),
                        ]
                    );
                }

                let curr_dt = dt;
                if (nextCollision !== null && dt > nextCollision['t']) curr_dt = nextCollision['t'];

                totalTime += curr_dt;

                blackx += blackvx * curr_dt * TIME_MODIFIER;
                blacky += blackvy * curr_dt * TIME_MODIFIER;
                whitex += whitevx * curr_dt * TIME_MODIFIER;
                whitey += whitevy * curr_dt * TIME_MODIFIER;

                if (nextCollision !== null) {
                    nextCollision['t'] -= curr_dt;
                    if (nextCollision['t'] <= 0) {
                        if (Math.sqrt(Math.pow(blackx - whitex, 2) + Math.pow(blacky - whitey, 2)) / r >= 3.5) {
                            nextCollision.onCollision(nextCollision['normal'], IMPACT_STRENGTH);
                        }

                        const [nx, ny] = nextCollision['normal'];
                        if (nextCollision['color'] == 'white') {
                            const dot = whitevx * nx + whitevy * ny;
                            whitevx -= 2 * dot * nx;
                            whitevy -= 2 * dot * ny;
                        } else {
                            const dot = blackvx * nx + blackvy * ny;
                            blackvx -= 2 * dot * nx;
                            blackvy -= 2 * dot * ny;
                        }

                        nextCollision = null;

                        keyframeTimes['white'].push(totalTime);
                        keyframeTimes['black'].push(totalTime);
                        keyframesX['white'].push(whitex);
                        keyframesY['white'].push(whitey);
                        keyframesX['black'].push(blackx);
                        keyframesY['black'].push(blacky);
                    }
                }

                dt -= curr_dt;
            }

            keyframeTimes['white'].push(totalTime);
            keyframeTimes['black'].push(totalTime);
            keyframesX['white'].push(whitex);
            keyframesY['white'].push(whitey);
            keyframesX['black'].push(blackx);
            keyframesY['black'].push(blacky);
        }

        prevTime = timestamp;

        ctx.clearRect(0, 0, W, H);

        function renderMotionBlur(t, x, y, color) {
            ctx.fillStyle = color;

            const stepSize = t[t.length - 1] / N_MOTION_BLUR_FIGURES;
            let idx = 0;

            for (var i = 0; i < N_MOTION_BLUR_FIGURES; i++) {
                const currTime = i * stepSize;
                while (idx < t.length - 1 && currTime > t[idx + 1]) idx++;
                const w = (currTime - t[idx]) / (t[idx + 1] - t[idx]);
                const currX = (1 - w) * x[idx] + w * x[idx + 1];
                const currY = (1 - w) * y[idx] + w * y[idx + 1];

                ctx.beginPath();
                ctx.arc(currX, currY, r, 0, 2 * Math.PI);
                ctx.fill();
            }
        }

        // black section
        ctx.fillStyle = '#32264a';

        ctx.beginPath();
        ctx.moveTo(x[0], y[0]);
        for (var i = 0; i < x.length - 1; i++) {
            ctx.lineTo(x[i + 1], y[i + 1]);
        }

        ctx.arc(W / 2, H / 2, R * 2, 1.5 * Math.PI, Math.PI / 2);

        ctx.fill();

        // white section
        ctx.fillStyle = '#f5e7a4';

        ctx.beginPath();

        ctx.moveTo(x[x.length - 1], y[y.length - 1]);
        for (var i = x.length - 1; i >= 1; i--) {
            ctx.lineTo(x[i - 1], y[i - 1]);
        }

        ctx.arc(W / 2, H / 2, R * 2, Math.PI / 2, 1.5 * Math.PI);

        ctx.fill();

        // boundary ghost
        ctx.fillStyle = '#d68dac';
        ctx.beginPath();
        ctx.moveTo(x[0], y[0]);
        for (var i = 1; i < x.length; i++) {
            ctx.lineTo(x[i], y[i]);
        }

        ctx.lineTo(xShadow[xShadow.length - 1], yShadow[yShadow.length - 1]);
        for (var i = xShadow.length - 2; i >= 0; i--) {
            ctx.lineTo(xShadow[i], yShadow[i]);
        }

        ctx.fill();

        // black ball
        renderMotionBlur(keyframeTimes['black'], keyframesX['black'], keyframesY['black'], '#32264a');

        // white ball
        renderMotionBlur(keyframeTimes['white'], keyframesX['white'], keyframesY['white'], '#f5e7a4');

        // outer ghost
        ctx.fillStyle = '#d68dac';
        ctx.beginPath();
        ctx.moveTo(W / 2 + 2 * R, H / 2);
        for (var i = xCircleShadow.length - 1; i >= 0; i--) {
            ctx.lineTo(xCircleShadow[i], yCircleShadow[i]);
        }

        ctx.lineTo(xCircleShadow[xCircleShadow.length - 1], yCircleShadow[xCircleShadow.length - 1]);
        ctx.lineTo(W / 2 + 2 * R, H / 2);
        ctx.arc(W / 2, H / 2, R * 2, 0, 2 * Math.PI);

        ctx.fill();

        requestAnimationFrame(render);

        if (Math.random() < -.1) {
            const idx = Math.round(Math.random() * (x.length - 10)) + 5;
            const tangentAngle = Math.atan2(y[idx + 1] - y[idx - 1], x[idx + 1] - x[idx - 1]);
            const perturbAngle = tangentAngle + (Math.random() < .5 ? 1 : -1) * Math.PI / 2;
            x[idx] += 200 * Math.cos(perturbAngle);
            y[idx] += 200 * Math.sin(perturbAngle);

            const d = Math.sqrt(Math.pow(x[idx] - W / 2, 2) + Math.pow(y[idx] - H / 2, 2));
            if (d > 2 * R) {
                x[idx] = W / 2 + 2 * R / d * (x[idx] - W / 2);
                y[idx] = H / 2 + 2 * R / d * (y[idx] - H / 2);
            }

            smooth([x, y], WINDOW, idx);
        }

        for (var i = 0; i < x.length; i++) {
            xShadow[i] = ALPHA * xShadow[i] + (1 - ALPHA) * x[i];
            yShadow[i] = ALPHA * yShadow[i] + (1 - ALPHA) * y[i];
        }

        for (var i = 0; i < xCircleShadow.length; i++) {
            const dx = xCircleShadow[i] - W / 2, dy = yCircleShadow[i] - H / 2;
            const magnitude = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
            const factor = (ALPHA * magnitude + (1 - ALPHA) * 2 * R) / magnitude;
            xCircleShadow[i] = W / 2 + factor * dx;
            yCircleShadow[i] = H / 2 + factor * dy;
        }
    }

    requestAnimationFrame(render);

    setTimeout(function() {
        if (blackvx == 0 && blackvy == 0) {
            let angle = Math.random() * 2 * Math.PI;
            blackvx = Math.cos(angle);
            blackvy = Math.sin(angle);

            angle = Math.random() * 2 * Math.PI;
            whitevx = Math.cos(angle);
            whitevy = Math.sin(angle);
        }
    }, 200);

    document.querySelector('#speed').addEventListener('input', function() {
        TIME_MODIFIER = Math.exp(Number(this.value));
        nextCollision = null;
    });

    document.querySelector('#speed').dispatchEvent(new Event('input', { bubbles: true }));

    document.querySelector('#impact').addEventListener('input', function() {
        IMPACT_STRENGTH = Math.exp(Number(this.value));
    });

    document.querySelector('#impact').dispatchEvent(new Event('input', { bubbles: true }));

    document.querySelector('#smoothness').addEventListener('input', function() {
        WINDOW = generateHamming(Number(this.value));
    });

    document.querySelector('#smoothness').dispatchEvent(new Event('input', { bubbles: true }));
}