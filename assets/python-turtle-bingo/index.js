const domUrl = window.URL || window.webkitURL || window;
const turtle_div = document.getElementById('turtle-div');
document.codeEditor = null;
document.turtleWidth = null;
var scroll = 0;
document.currChallenge = null;

const INIT_CODE = `
################################################################################
############################## Python Turtle Bingo #############################
################################################################################

# Hi! In this game your aim is to recreate pictures using python turtle
#    [https://docs.python.org/3/library/turtle.html].

# Clicking on the target image (bottom right) will display the clicked point
# coordinates and color.

# You can use any web-compatible color specification
# (e.g. "#ff0088", "rgb(255, 0, 128)", etc.)

# No need to import or handle the screen (image size 500x500 px).

# For example, uncomment and run this code:

# turtle.bgcolor('#b1e3f0')
# turtle.width(5)
# turtle.circle(55)

# For some drawings the numbers can feel arbitrary, I tried to stick
# to round numbers and minimal complexity



# Enabled by OSS:
# - Brython [https://brython.info/]
# - Ace editor [https://ace.c9.io/]

# Have fun!

# p.s. background image was procedurally generated, code here:
# [https://gist.github.com/andersource/5dec1fafee09c22ae673787b66d8e7e5]
`

const targets = [
    {
        'url': '/assets/python-turtle-bingo/targets/1.png',
        'difficulty': 1
    },
    {
        'url': '/assets/python-turtle-bingo/targets/2.png',
        'difficulty': 1,
        'extraClasses': 'shiftDown'
    },
    {
        'url': '/assets/python-turtle-bingo/targets/3.png',
        'difficulty': 1
    },
    {
        'url': '/assets/python-turtle-bingo/targets/4.png',
        'difficulty': 2
    },
    {
        'url': '/assets/python-turtle-bingo/targets/5.png',
        'difficulty': 2,
        'extraClasses': 'shiftDown'
    },
    {
        'url': '/assets/python-turtle-bingo/targets/6.png',
        'difficulty': 2
    },
    {
        'url': '/assets/python-turtle-bingo/targets/7.png',
        'difficulty': 3
    },
    {
        'url': '/assets/python-turtle-bingo/targets/8.png',
        'difficulty': 3,
        'extraClasses': 'shiftDown'
    },
    {
        'url': '/assets/python-turtle-bingo/targets/9.png',
        'difficulty': 3
    },
    {
        'url': '/assets/python-turtle-bingo/targets/10.png',
        'difficulty': 4
    },
    {
        'url': '/assets/python-turtle-bingo/targets/11.png',
        'difficulty': 4,
        'extraClasses': 'shiftDown'
    },
    {
        'url': '/assets/python-turtle-bingo/targets/12.png',
        'difficulty': 4
    },
    {
        'url': '/assets/python-turtle-bingo/targets/13.png',
        'difficulty': 5
    },
    {
        'url': '/assets/python-turtle-bingo/targets/14.png',
        'difficulty': 5,
        'extraClasses': 'shiftDown'
    },
    {
        'url': '/assets/python-turtle-bingo/targets/15.png',
        'difficulty': 5
    },
    {
        'url': '/assets/python-turtle-bingo/targets/16.png',
        'difficulty': 6
    },
    {
        'extraClasses': 'hidden'
    },
    {
        'url': '/assets/python-turtle-bingo/targets/17.png',
        'difficulty': 6
    },
];

function fromBinary(encoded) {
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return String.fromCharCode(...new Uint16Array(bytes.buffer));
}

function loadTargets() {
    const container = document.getElementById('target-gallery');
    for (var i = 0; i < targets.length; i++) {
        const challengeHTML = document.createElement('div');
        container.appendChild(challengeHTML);
        challengeHTML.outerHTML = `
            <div class="target ${targets[i].extraClasses || ""}">
                <img src="${targets[i].url || ""}"/>
                <div class="difficulty">
                    ${"<img/>".repeat(targets[i].difficulty || 0)}
                </div>
            </div>
        `;
        (url => {
            [...container.children].slice(-1)[0].onclick = function() {
                if (this.classList.contains('solved')) return;
                document.currChallenge = this;
                enterChallenge(url);
            };
        })(targets[i].url);
    }
}

function enterChallenge(url) {
    document.querySelector('#target-image').setAttribute('src', url);

    scroll = document.documentElement.scrollTop || document.body.scrollTop;
    const waitTime = scroll / 6;

    setTimeout(function() {
        document.querySelector('#background-image').setAttribute('hidden', 'hidden');
        document.querySelector('#target-gallery').setAttribute('hidden', 'hidden');
    }, waitTime + 500);

    setTimeout(function() {
        document.querySelector('#challenge').classList.remove('hidden');
    }, waitTime);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function leaveChallenge() {
    document.querySelector('#challenge').classList.add('hidden');
    document.querySelector('#background-image').removeAttribute('hidden');
    document.querySelector('#target-gallery').removeAttribute('hidden');
    window.scrollTo({ top: scroll, behavior: 'smooth' });
    document.querySelector('#pixel-inspector').classList.add('hidden');
    setScore(0);
    document.currChallenge = null;
}

function draw(callback) {
    const sourceSvg = document.getElementById('turtle-canvas');
    const halfRemainingWidth = Math.round((500 - document.turtleWidth) / 2);
    sourceSvg.setAttribute('viewBox', `-${halfRemainingWidth} -${halfRemainingWidth} 500 500`);
    var svgText = sourceSvg.outerHTML;
    if (!svgText.match(/xmlns=\"/mi)) {
        svgText = svgText.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ');
    }

    const svg = new Blob([svgText], {
        type: "image/svg+xml;charset=utf-8"
    });

     const url = domUrl.createObjectURL(svg);

     const img = new Image();

     img.onload = function() {
        const canvas = document.getElementById('svg-target');
        canvas.parentElement.insertBefore(img, canvas);
        canvas.setAttribute('hidden', 'hidden');
        turtle_div.setAttribute('hidden', 'hidden');

        setTimeout(function() {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, 500, 500);
            domUrl.revokeObjectURL(url);
            canvas.parentElement.removeChild(img);
            canvas.removeAttribute('hidden');
            callback();
        }, 500);
     };

     img.src = url;
}

function copyTargetToCanvas() {
    const canvas = document.getElementById('target-canvas');
    const ctx = canvas.getContext('2d');
    const img = document.getElementById('target-image');
    ctx.drawImage(img, 0, 0, 500, 500);
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function evaluate() {
    const codeCanvas = document.getElementById('svg-target');
    const targetCanvas = document.getElementById('target-canvas');
    const codeCtx = codeCanvas.getContext('2d');
    const targetCtx = targetCanvas.getContext('2d');
    const codeData = codeCtx.getImageData(0, 0, 500, 500).data;
    const targetData = targetCtx.getImageData(0, 0, 500, 500).data;

    const targetCounts = {};
    const correctCounts = {};
    for (var i = 0; i < targetData.length; i += 4) {
        const codePixel = codeData.slice(i, i + 3);
        const targetPixel = targetData.slice(i, i + 3);
        const colorKey = rgbToHex(...targetPixel);
        targetCounts[colorKey] = (targetCounts[colorKey] || 0) + 1;
        const d = Math.sqrt(Math.pow(codePixel[0] - targetPixel[0], 2)
                            + Math.pow(codePixel[1] - targetPixel[1], 2)
                            + Math.pow(codePixel[2] - targetPixel[2], 2));
        if (d <= 10) {
            correctCounts[colorKey] = (correctCounts[colorKey] || 0) + 1;
        }
    }

    const colorKeys = Object.keys(targetCounts);
    const totalPixels = Object.values(targetCounts).reduce((a, b) => a + b);
    const result = {};
    for (var colorIdx = 0; colorIdx < colorKeys.length; colorIdx++) {
        const key = colorKeys[colorIdx];
        if (targetCounts[key] / totalPixels >= .02) {
            result[key] = (correctCounts[key] || 0) / targetCounts[key];
        }
    }

    var score = Object.values(result).length / (Object.values(result).map(x => 1 / x).reduce((a, b) => a + b));
    score = Math.pow(score, 5.215168);

    console.log(score);

    setScore(score);
}

function setScore(score) {
    const mask = document.querySelector('#score .mask');
    const width = 100 - Math.round(score * 100);
    mask.style.width = `${width}%`;
    if (score >= .9) {
        document.currChallenge.classList.add('solved');
        setTimeout(function() {
            mask.classList.add('solved');
            setTimeout(function() {
                leaveChallenge();
            }, 1200);
        }, 500);
    } else {
        mask.classList.remove('solved');
    }
}

function setCanvasSize(canvas, size) {
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
}

function setChallengeSizes() {
    const container = document.querySelector('#challenge');
    const editor = document.querySelector('#editor-container');
    const turtle = document.querySelector('#turtle-container');
    document.turtleWidth = Math.min(500, Math.round(.42 * container.clientHeight));
    const editorWidth = container.clientWidth - document.turtleWidth - 2;
    turtle.style.width = `${document.turtleWidth + 2}px`;
    editor.style.width = `${editorWidth}px`;
    const svgTarget = document.querySelector('#svg-target');
    const targetCanvas = document.querySelector('#target-canvas');
    setCanvasSize(svgTarget, document.turtleWidth);
    setCanvasSize(targetCanvas, document.turtleWidth);
    container.classList.add('hidden');
}

window.addEventListener('load', function() {
    loadTargets();
    setChallengeSizes();
    document.querySelectorAll('canvas').forEach(x => x.addEventListener('click', function(e) {
        document.querySelector('#pixel-inspector').classList.remove('hidden');
        const x = Math.round(e.offsetX * 500 / document.turtleWidth);
        const y = Math.round(e.offsetY * 500 / document.turtleWidth);
        document.querySelector('#inspect-x').innerHTML = `x = ${x - 250}`;
        document.querySelector('#inspect-y').innerHTML = `y = ${250 - y}`;
        const ctx = this.getContext('2d');
        const data = ctx.getImageData(x, y, 1, 1).data.slice(0, 3);
        const color = rgbToHex(...data);
        document.querySelector('#inspect-color-demo').style.background = color;
        document.querySelector('#inspect-color').innerHTML = color;
    }));

    document.codeEditor = ace.edit("editor");
    document.codeEditor.setTheme("ace/theme/cobalt");
    document.codeEditor.session.setMode("ace/mode/python");
    document.codeEditor.container.style.fontSize = '1.0em';
    document.codeEditor.setValue(INIT_CODE, -1);

    document.querySelector('#back').addEventListener('click', leaveChallenge);
    document.querySelector('#target-image').onload = copyTargetToCanvas;
    document.codeEditor.container.addEventListener('keydown', function(e) {
        if ((e.keyCode == 10 || e.keyCode == 13) && e.ctrlKey) {
            document.querySelector('#run').click();
        }
    });

    window.draw = draw;
    window.evaluate = evaluate;
});