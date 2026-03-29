import * as acorn from "./lib/acorn.mjs";


function extractIdentifiers(node) {
    let res = new Set();
    if (node.type == 'MemberExpression') return res;
    if (node.type == 'Identifier') res.add(node.name);
    const potentialChildren = ['left', 'right', 'argument', 'arguments'];
    for (let i = 0; i < potentialChildren.length; i++) {
        const child = node[potentialChildren[i]];
        if (child !== undefined) {
            if (child.length === undefined) {
                res = res.union(extractIdentifiers(child));
            } else {
                for (let j = 0; j < child.length; j++) {
                    res = res.union(extractIdentifiers(child[j]));
                }
            }
        }
    }

    return res;
}


function randInt(n) {
    return Math.floor(n * Math.random());
}

function samplePopulation(n, m, c) {
    const indices = [...new Array(n)].map((x, i) => i);
    indices.splice(c, 1);
    const res = [];
    for (let i = 0; i < m; i++) {
        res.push(indices.splice(randInt(indices.length), 1)[0]);
    }

    return res;
}


function mutate(x1, x2, x3, diffFactor) {
    const res = [...x1];
    for (let i = 0; i < res.length; i++) {
        res[i] += diffFactor * (x2[i] - x3[i]);
    }

    return res;
}


function enforceBounds(x, bounds) {
    for (let i = 0; i < x.length; i++) {
        const currMin = bounds[i][0], currMax = bounds[i][1];
        if (x[i] < currMin) x[i] = currMin;
        else if (x[i] > currMax) x[i] = currMax;
    }

    return x;
}


function crossover(x1, x2, crossover_p) {
    return [...new Array(x1.length)].map((x, i) => {
        return Math.random() <= crossover_p ? x1[i] : x2[i]
    });
}


function argMin(v) {
    let min = v[0];
    let minIdx = 0;
    for (let i = 1; i < v.length; i++) {
        if (v[i] < min) {
            min = v[i];
            minIdx = i;
        }
    }

    return minIdx;
}


function differentialEvolution(func, bounds) {
    const N = bounds.length;
    /*const POPSIZE = 20;
    const MAXITER = 150;*/
    const POPSIZE = 20;
    const MAXITER = 300;
    const samples = [...new Array(N)].map((_, varIdx) =>
        [...new Array(POPSIZE)].map((x, i) =>
            (i + 1 + Math.random()) / (POPSIZE + 1) * (bounds[varIdx][1] - bounds[varIdx][0])
            + bounds[varIdx][0]
        )
    );

    const population = [...new Array(POPSIZE)].map(() => {
        return [...new Array(N)].map((_, i) => samples[i][randInt(POPSIZE)]);
    });
    const scores = population.map(x => func(...x));

    for (let gen = 0; gen < MAXITER; gen++) {
        const diffFactor = (Math.random() + 1) / 2;
        const crossover_p = .2 + .3 * Math.random();
        for (let candidate = 0; candidate < POPSIZE; candidate++) {
            const [i1, i2, i3] = samplePopulation(POPSIZE, 3, candidate);
            const donor = enforceBounds(mutate(population[i1], population[i2], population[i3], diffFactor), bounds);
            const trial = crossover(population[candidate], donor, crossover_p);
            const trialScore = func(...trial);
            if (trialScore < scores[candidate]) {
                population[candidate] = trial;
                scores[candidate] = trialScore;
            }
        }
    }

    return population[argMin(scores)];
}


function _regularizationTerm(variables, lastValues, bounds) {
    return variables.map((x, i) => {
        const range = bounds[i][1] - bounds[i][0];
        return `((${x} - ${lastValues[x]}) / ${range}) ** 2`;
    }).join(' + ')
}


function bindSpace(uuid, identifiers, bounds, left, right) {
    function solve(variable, value, lastValues) {
        const varIdx = identifiers.indexOf(variable);
        const partialVars = [...identifiers];
        const partialBounds = [...bounds];
        partialVars.splice(varIdx, 1);
        partialBounds.splice(varIdx, 1);

        const loss_f = eval?.(`
(${partialVars.join(', ')}) => {
    const ${variable} = ${value};
    const leftValue = ${left};
    const rightValue = ${right};
    const constraint = ((leftValue - rightValue) / Math.max(Math.abs(leftValue), Math.abs(rightValue))) ** 2;
    const reg = ${_regularizationTerm(partialVars, lastValues, partialBounds)};
    return 1000 * constraint + reg;
}
`);

        const relative_error_f = eval?.(`
(${partialVars.join(', ')}) => {
    const ${variable} = ${value};
    const leftValue = ${left};
    const rightValue = ${right};
    return (Math.abs(leftValue - rightValue) / Math.max(Math.abs(leftValue), Math.abs(rightValue)));
}
`);

        const res = differentialEvolution(loss_f, partialBounds);
        if (relative_error_f(...res) > .01) {
            throw new Error('No feasible solution found');
        }

        return res;
    }

    function _handleBubbles() {
        for (let i = 0; i < identifiers.length; i++) {
            const varName = identifiers[i];
            const sliderId = `${uuid}_${varName}`;
            const range = document.querySelector(`#${sliderId}`);
            const bubble = document.querySelector(`#${sliderId}_bubble`);
            bubble.innerHTML = range.value;
            const bubbleX = (
                range.offsetLeft
                + (range.clientWidth / 2)
                + (range.clientWidth - 16) * (
                    (range.valueAsNumber - parseFloat(range.min))
                    / (parseFloat(range.max) - parseFloat(range.min)) - .5
                )
            );
            bubble.style.left = `${bubbleX}px`;
        }
    }

    const error = document.querySelector(`#${uuid}_error`);
    const lastValues = {};
    for (let i = 0; i < identifiers.length; i++) {
        lastValues[identifiers[i]] = (bounds[i][0] + bounds[i][1]) / 2;
    }

    const allSliders = document.querySelectorAll(`input[type=range][data-uuid=${uuid}]`);
    allSliders[0].value = lastValues[identifiers[0]];

    allSliders.forEach(slider => {
        slider.onchange = function() {
            allSliders.forEach(x => {
                lastValues[x.getAttribute('data-var')] = x.valueAsNumber;
            });
        };

        slider.oninput = function() {
            const otherSliders = [...allSliders];
            otherSliders.splice(otherSliders.indexOf(this), 1);
            try {
                const res = solve(this.getAttribute('data-var'), this.value, lastValues);
                error.classList.add('hidden');
                for (let i = 0; i < otherSliders.length; i++) {
                    otherSliders[i].value = res[i];
                }

                _handleBubbles();
            } catch (exception) {
                error.classList.remove('hidden');
                error.innerText= exception.toString();
            }
        }
    });

    allSliders[0].oninput();
    allSliders[0].onchange();
}


class ConstrainedSpace {
    constructor(exprString) {
        this.expr = acorn.parse(exprString, {ecmaVersion: '2020'}).body[0].expression;
        if (this.expr.type != 'BinaryExpression' || this.expr.operator != '==') {
            throw new Error("Constraint must  be equality");
        }

        this.left = exprString.substring(this.expr.left.start, this.expr.left.end);
        this.right = exprString.substring(this.expr.right.start, this.expr.right.end);
        this.identifiers = [...extractIdentifiers(this.expr)];
        if (this.identifiers.length < 2) {
            throw new Error("Expression must contain at least two free variables");
        }

        this.bounds = this.identifiers.map(x => [0, 1]);
        this.uuid = `ts_${crypto.randomUUID().replaceAll('-', '_')}`;
    }

    _makeSlider(varIdx) {
        const varName = this.identifiers[varIdx];
        const bounds = this.bounds[varIdx];
        const stepSize = (bounds[1] - bounds[0]) / 100;
        const sliderId = `${this.uuid}_${varName}`;
        return (
`<!-- ${varName} slider -->
<div class="anchor"><label for="${sliderId}">${varName}:&nbsp;${bounds[0]}</label></div>
<input id="${sliderId}" type=range min="${bounds[0]}" max="${bounds[1]}" step="${stepSize}"
       data-var="${varName}" data-uuid="${this.uuid}">
<label for="${sliderId}">${bounds[1]}</label>
<output class="bubble" id="${sliderId}_bubble"></output>`
        );
    }

    slidersHTML() {
        const container = document.createElement('div');
        container.innerHTML = [...new Array(this.identifiers.length)].map((x, i) => this._makeSlider(i)).join('<br/>');
        container.id = 'sliders-container';

        return container.outerHTML;
    }

    bind() {
        document.querySelector('#sliders-container').outerHTML = this.slidersHTML();
        document.querySelector('[data-error]').id = `${this.uuid}_error`;
        this.embed();
        bindSpace(this.uuid, this.identifiers, this.bounds, this.left, this.right);
        const expression = `${this.left} == ${this.right}`;
        history.pushState(null, null, `#${serialize(expression, this.bounds, this.identifiers)}`);
    }

    embed() {
        document.querySelector('#html').innerText = (
            ['<div class="container">', ...[...new Array(this.identifiers.length)]
                .map((x, i) => this._makeSlider(i)), '</div>',
                `<div><p id="${this.uuid}_error" class="hidden error"></p></div>`
            ].join('<br/>\n\n')
        );

        document.querySelector('#javascript').innerText = this._embedJS();

        document.querySelector('#embed').classList.remove('hidden');
    }

    _embedJS() {
        let res = (
            [randInt, samplePopulation, mutate, crossover, enforceBounds,
             argMin, differentialEvolution, _regularizationTerm, bindSpace]
            .map(x => x.toString())
        );

        res = [
            '// --------- Global (copy just once if you have multiple groups of sliders) ---------',
            ...res,
            '// --------- Problem-specific ---------',
`window.onload = function() {
    bindSpace("${this.uuid}",
              ${JSON.stringify(this.identifiers)},
              ${JSON.stringify(this.bounds)},
              "${this.left}", "${this.right}");
};`
        ];

        return res.join('\n\n');
    }
}


function serialize(expression, bounds, identifiers) {
    return btoa(JSON.stringify({
        expression: expression,
        bounds: bounds,
        identifiers: identifiers
    }));
}

function deserialize(hash) {
    const data = JSON.parse(atob(hash));
    document.querySelector('input[type=text]').value = data.expression;
    document.querySelector('#go').click();
    setTimeout(function() {
        for (let i = 0; i < data.identifiers.length; i++) {
            const fromNumber = document.querySelector(`#${data.identifiers[i]}_from`);
            fromNumber.value = data.bounds[i][0];
            fromNumber.oninput();
            const toNumber = document.querySelector(`#${data.identifiers[i]}_to`);
            toNumber.value = data.bounds[i][1];
            toNumber.oninput();
        }
    }, 0);
}


function parse() {
    const exprString = document.querySelector('#expression').value;
    const error = document.querySelector('[data-error]');
    const boundsDiv = document.querySelector('#bounds-container');
    boundsDiv.innerHTML = '';
    let space;

    try {
        space = new ConstrainedSpace(exprString);
    } catch (exception) {
        error.innerText = exception.toString();
        document.querySelector('#sliders-container').innerHTML = '';
        error.classList.remove('hidden');
        return;
    }

    error.classList.add('hidden');

    for (let i = 0; i < space.identifiers.length; i++) {
        const varBounds = document.createElement('p');
        const varName = space.identifiers[i];
        varBounds.innerHTML = `<div class="anchor"><p>${varName} goes from &nbsp;</p></div><input type="number" id="${varName}_from" value=0> to <input type="number" id="${varName}_to" value=1>`;
        boundsDiv.appendChild(varBounds);
    }

    space.bind();

    document.querySelectorAll('input[type=number]').forEach(x => {
        x.oninput = function() {
            let varName, boundIdx;
            if (x.id.endsWith('_from')) {
                varName = x.id.replace('_from', '');
                boundIdx = 0;
            } else {
                varName = x.id.replace('_to', '');
                boundIdx = 1;
            }

            const varIdx = space.identifiers.indexOf(varName);
            space.bounds[varIdx][boundIdx] = this.valueAsNumber;

            const error = document.querySelector('[data-error]');
            if (space.bounds[varIdx][0] >= space.bounds[varIdx][1]) {
                error.innerText = `Check bounds for ${varName}`;
                error.classList.remove('hidden');
            } else {
                error.classList.add('hidden');
                space.bind();
            }
        };
    });
}

window.onload = function() {
    document.querySelector('#go').onclick = parse;
    document.querySelector('input[type=text]').onkeydown = function(e) {
        if (e.keyCode == 13) parse();
    };

    document.querySelectorAll('input[type=button][value=copy]').forEach(x => {
        x.onclick = function() {
            navigator.clipboard.writeText(
                this.parentElement.nextElementSibling.innerText
            );
        };
    });

    document.querySelector('#expression').focus();

    window.onhashchange = function() {
        const hash = window.location.hash.replace('#', '');
        const error = document.querySelector('[data-error]');
        if (hash != '') {
            try {
                deserialize(hash);
            } catch (ex) {
                error.innerText = ex.toString();
                error.classList.remove('hidden');
            }
        }
    };

    window.onhashchange();
}