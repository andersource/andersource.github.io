---
layout: post
title:  "Tradeoff Sliders"
description: "Interactive exploration of constrained spaces"
date:   2026-03-29 18:37:00
categories:
image: "/assets/thumbnails/tradeoff_sliders.webp"
themecolor: "#38235c"
hide_thumbnail: true
---

<style>
input[type=range] {
    width: 70%;
    margin: 2em;
}

output.bubble {
    background: red;
    color: white;
    position: absolute;
    transform: translateX(-50%) translateY(calc(-50% - 3px));
    left: 0;
    padding: .15em .35em;
    border-radius: 3px;
}

output.bubble:before {
    content: "";
    position: absolute;
    width: 0;
    height: 0;
    border-top: 5px solid red;
    border-left: 3px solid transparent;
    border-right: 3px solid transparent;
    top: 100%;
    left: 50%;
    margin-left: -3px;
    margin-top: -1px;
}

div.anchor {
    display: inline-block;
    width: 0;
    height: 1em;
    position: relative;
}

div.anchor label, div.anchor p {
    position: absolute;
    right: 0;
    width: max-content;
    margin: 0;
}

.container {
    width: 75%;
    text-align: center;
    margin: 0 auto;
}

@media (max-width: 420px) {
    .container {
        width: 65%;
        font-size: .85em;
    }

    input[type=range] {
        width: 50%;
    }
}

.hidden {
    visibility: hidden;
}

.error {
    color: red;
    text-align: center;
}
</style>

The world feels batshit insane right now. Between a dubious war and AI doomerism, working on side projects feels futile; if I'm not meta-orchestrating a cackle of agents via subvocalization from the bomb shelter, I'm doing it wrong.

Fortunately I'm not intimidated by futility, and decided to fight back by pursuing a niche problem I occasionally have, writing HTML and JS by hand like it's 2007. That'll show`em!

### Wedding financials

January 2025: my soon-to-be-wife and I are planning our wedding, and have to make some chicken-and-egg decisions around budget, venue and number of invitees.
Though governed by the simple constraint `total cost == money spent`, the variables interact in nontrivial dynamics and offer several possible tradeoffs. As I well know from constrained optimization, if I could reduce all these variables into a single objective function to score the desirability of a specific tradeoff, I could find an optimal solution automatically.

But that's not how humans work. If I'm going to save $3000 by not inviting distant relatives, I want to decide it myself, not have it spat out by some arcane formula. What I want isn't constrained optimization; it's to _directly interact with the constraint_, and explore the manifold it induces on the space in a way that allows me to build intuition about the tradeoff dynamics.

I've felt that itch before, but it was during this time that I started to (semi-)seriously contemplate what such interaction might look like. That's when the idea for the tradeoff sliders was born.

### The Snacks Guy

You and a couple of friends are organizing a party, and you've been appointed the snacks guy (or gal), with a $200 budget. Not one to take your duties lightly, you want to explore your options before making a decision. And by "options" I mean not just which snacks you could buy, but also how to allocate the budget between them.

Conveniently, the local general store's snacks section is very limited, offering only popcrn, for $5 a bag, and liquorice sticks, $12 a pack. Exploring the tradeoff is as easy as these two sliders!

<div class="container"><br/>

<!-- popcorn slider -->
<div class="anchor"><label for="ts_c1d776aa_2c54_4817_9bba_3cc0341372c7_popcorn">popcorn:&nbsp;0</label></div>
<input id="ts_c1d776aa_2c54_4817_9bba_3cc0341372c7_popcorn" type=range min="0" max="40" step="1"
       data-var="popcorn" data-uuid="ts_c1d776aa_2c54_4817_9bba_3cc0341372c7">
<label for="ts_c1d776aa_2c54_4817_9bba_3cc0341372c7_popcorn">40</label>
<output class="bubble" id="ts_c1d776aa_2c54_4817_9bba_3cc0341372c7_popcorn_bubble"></output><br/>

<!-- liquorice slider -->
<div class="anchor"><label for="ts_c1d776aa_2c54_4817_9bba_3cc0341372c7_liquorice">liquorice:&nbsp;0</label></div>
<input id="ts_c1d776aa_2c54_4817_9bba_3cc0341372c7_liquorice" type=range min="0" max="16" step="1"
       data-var="liquorice" data-uuid="ts_c1d776aa_2c54_4817_9bba_3cc0341372c7">
<label for="ts_c1d776aa_2c54_4817_9bba_3cc0341372c7_liquorice">16</label>
<output class="bubble" id="ts_c1d776aa_2c54_4817_9bba_3cc0341372c7_liquorice_bubble"></output><br/>

</div><br/>

<div><p id="ts_c1d776aa_2c54_4817_9bba_3cc0341372c7_error" class="hidden error"></p></div>

Alas! As you approach the snacks shelf, you see that the store started importing Wasabi peas, for $7 a bag. Judy will be delighted, but the tradeoff is harder to consider in full. You want to add another slider, but how to make the three of them auto-update to respect the budget without hard-coding a preference for one snack over another? You could, in theory, create a 3D chart to depict the tradeoffs, but this is clearly not generalizable should the store add another snack to the selection.

Reluctantly, you enter all the data to Excel, where you create conditional formatting to show you when you're overbudget. This does the job - Excel tends to deliver - but the _feedback loop_. It's _so slow_.

This is what the tradeoff sliders are meant to solve. When we were planning the wedding, we used Excel, but I found myself yearning for an almost physical interface where the constraint simply _can't_ be violated, yet I'm free to explore the space otherwise. Here, give it a try:

<div class="container"><br/>

<!-- popcorn slider -->
<div class="anchor"><label for="ts_cb462578_b8b8_4b9c_8d99_5f31fc6d9180_popcorn">popcorn:&nbsp;0</label></div>
<input id="ts_cb462578_b8b8_4b9c_8d99_5f31fc6d9180_popcorn" type=range min="0" max="40" step="1"
       data-var="popcorn" data-uuid="ts_cb462578_b8b8_4b9c_8d99_5f31fc6d9180">
<label for="ts_cb462578_b8b8_4b9c_8d99_5f31fc6d9180_popcorn">40</label>
<output class="bubble" id="ts_cb462578_b8b8_4b9c_8d99_5f31fc6d9180_popcorn_bubble"></output><br/>

<!-- liquorice slider -->
<div class="anchor"><label for="ts_cb462578_b8b8_4b9c_8d99_5f31fc6d9180_liquorice">liquorice:&nbsp;0</label></div>
<input id="ts_cb462578_b8b8_4b9c_8d99_5f31fc6d9180_liquorice" type=range min="0" max="16" step="1"
       data-var="liquorice" data-uuid="ts_cb462578_b8b8_4b9c_8d99_5f31fc6d9180">
<label for="ts_cb462578_b8b8_4b9c_8d99_5f31fc6d9180_liquorice">16</label>
<output class="bubble" id="ts_cb462578_b8b8_4b9c_8d99_5f31fc6d9180_liquorice_bubble"></output><br/>

<!-- wasapeas slider -->
<div class="anchor"><label for="ts_cb462578_b8b8_4b9c_8d99_5f31fc6d9180_wasapeas">wasapeas:&nbsp;0</label></div>
<input id="ts_cb462578_b8b8_4b9c_8d99_5f31fc6d9180_wasapeas" type=range min="0" max="28" step="1"
       data-var="wasapeas" data-uuid="ts_cb462578_b8b8_4b9c_8d99_5f31fc6d9180">
<label for="ts_cb462578_b8b8_4b9c_8d99_5f31fc6d9180_wasapeas">28</label>
<output class="bubble" id="ts_cb462578_b8b8_4b9c_8d99_5f31fc6d9180_wasapeas_bubble"></output><br/>

</div><br/>

<div><p id="ts_cb462578_b8b8_4b9c_8d99_5f31fc6d9180_error" class="hidden error"></p></div>

### How does it work?

At the heart of every group of tradeoff sliders is the _constraint_: an equality that must be satisfied throughout changes to the variables. Each variable also has bounds. Then when you move a slider, a tiny [differential evolution](https://en.wikipedia.org/wiki/Differential_evolution) optimization is run to find values for the other sliders such that the equality is still satisfied, and all sliders (other than the one you updated) move as little as possible from their previous positions. The effect is that the error created by you moving the slider is spread among the rest of the variables, to the degree possible.

This way, you can make changes while the constraint is preserved, and by spreading the error around the sliders aren't keeping you to the edge of the manifold. While not a perfect realization of the concept, I'm really happy with it as a first step.

### Business model back-of-the-envelope calculations

You've been there: sitting with friends, spitballing ideas for startups or apps. Pretty soon you find yourself doing back-of-the-envelope business model calculations: how much could we charge? What would be the operating costs? Quaint as the back of the envelope might be, this is another sort of exploration that calls for immediate feedback.

Here are tradeoff sliders for a simplistic business model: `active_users * (subscription) price == expenses + profit`

<div class="container"><br/>

<!-- active_users slider -->
<div class="anchor"><label for="ts_598756e5_96d5_4096_ac44_d997f2f0fc29_active_users">active_users:&nbsp;0</label></div>
<input id="ts_598756e5_96d5_4096_ac44_d997f2f0fc29_active_users" type=range min="0" max="10000" step="100"
       data-var="active_users" data-uuid="ts_598756e5_96d5_4096_ac44_d997f2f0fc29">
<label for="ts_598756e5_96d5_4096_ac44_d997f2f0fc29_active_users">10000</label>
<output class="bubble" id="ts_598756e5_96d5_4096_ac44_d997f2f0fc29_active_users_bubble"></output><br/>

<!-- price slider -->
<div class="anchor"><label for="ts_598756e5_96d5_4096_ac44_d997f2f0fc29_price">price:&nbsp;5</label></div>
<input id="ts_598756e5_96d5_4096_ac44_d997f2f0fc29_price" type=range min="5" max="50" step="0.45"
       data-var="price" data-uuid="ts_598756e5_96d5_4096_ac44_d997f2f0fc29">
<label for="ts_598756e5_96d5_4096_ac44_d997f2f0fc29_price">50</label>
<output class="bubble" id="ts_598756e5_96d5_4096_ac44_d997f2f0fc29_price_bubble"></output><br/>

<!-- expenses slider -->
<div class="anchor"><label for="ts_598756e5_96d5_4096_ac44_d997f2f0fc29_expenses">expenses:&nbsp;50000</label></div>
<input id="ts_598756e5_96d5_4096_ac44_d997f2f0fc29_expenses" type=range min="50000" max="200000" step="1500"
       data-var="expenses" data-uuid="ts_598756e5_96d5_4096_ac44_d997f2f0fc29">
<label for="ts_598756e5_96d5_4096_ac44_d997f2f0fc29_expenses">200000</label>
<output class="bubble" id="ts_598756e5_96d5_4096_ac44_d997f2f0fc29_expenses_bubble"></output><br/>

<!-- profit slider -->
<div class="anchor"><label for="ts_598756e5_96d5_4096_ac44_d997f2f0fc29_profit">profit:&nbsp;0</label></div>
<input id="ts_598756e5_96d5_4096_ac44_d997f2f0fc29_profit" type=range min="0" max="50000" step="500"
       data-var="profit" data-uuid="ts_598756e5_96d5_4096_ac44_d997f2f0fc29">
<label for="ts_598756e5_96d5_4096_ac44_d997f2f0fc29_profit">50000</label>
<output class="bubble" id="ts_598756e5_96d5_4096_ac44_d997f2f0fc29_profit_bubble"></output><br/>

</div><br/>

<div><p id="ts_598756e5_96d5_4096_ac44_d997f2f0fc29_error" class="hidden error"></p></div>

The idea isn't to provide some judgement call or evaluation for realism, only to provide an easy way to explore different combinations where the math checks out.

### Try it yourself

Making tradeoff sliders is so fun, I made a [small webpage](/assets/tradeoff_sliders/index.html) where you can make them yourself. Write the constraint as a javascript expression, fill in the bounds and explore away! It serializes through the hash (for example, you can play [here](/assets/tradeoff_sliders/index.html#eyJleHByZXNzaW9uIjoiYWN0aXZlX3VzZXJzICogcHJpY2UgPT0gZXhwZW5zZXMgKyBwcm9maXQiLCJib3VuZHMiOltbMCwxMDAwMF0sWzUsNTBdLFs1MDAwMCwyMDAwMDBdLFswLDUwMDAwXV0sImlkZW50aWZpZXJzIjpbImFjdGl2ZV91c2VycyIsInByaWNlIiwiZXhwZW5zZXMiLCJwcm9maXQiXX0=) with the business model ones), and you can even embed them in your own pages. The expression is parsed with [Acorn](https://github.com/acornjs/acorn). 


### Room for improvement

As happy as I am with this as the first iteration, there's still much to be desired:

* Sometimes the sliders' response is jittery. This happens because the optimization runs for a short time to respond in semi-realtime, and doesn't converge to the truly optimal solution that would be closest to the sliders' current value. I imagine WASM / WebGPU can be used to run more iterations without a performance hit.
* When I try to explore certain tradeoffs, there can be a feeling of fighting the sliders - each move undoes some of the last move, and I have to persist to converge to my desired tradeoff. Having a preference to move recently-changed sliders less than the others could solve this, or perhaps a UI for locking / setting the "resistance" for each slider.
* It would be nice to support more than one constraint, and allow inequalities.
* The UI could be improved, made more responsive, customizable etc.

I'm not going to do these now, but one can dream.

### Wedding financials revisited

Finally, some closure for the motivating example: an example of how planning our wedding with tradeoff sliders might have looked like. For this to make sense you'll need to understand a bit about wedding norms in Israel.

Typically, the majority of a wedding's cost will come from the venue's price-per-guest, with a few additional costs for various services such as photography, the DJ and so on.

It's customary for the guests to give money as the wedding gift to offset the costs (it's a pretty expensive deal for most couples), depending on how close they are to the couple (so if you invite distant relatives and a wider social circle, you can expect a lower average gift). While it's possible to pull off a cost-neutral wedding, realistically most couples (or their parents) have to spend a few tens of thousands of NIS.

(I have my personal criticism of the wedding institution and norms here, but refusing to play the game comes with its own price.)

Anyway, all this comes down to this constraint:

`budget == guests * (guest_price - average_gift) + extra_cost`

Which you can explore here, with roughly the ranges we considered:

<!-- wedding -->

<div class="container"><br/>

<!-- budget slider -->
<div class="anchor"><label for="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1_budget">budget:&nbsp;0</label></div>
<input id="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1_budget" type=range min="0" max="40000" step="400"
       data-var="budget" data-uuid="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1">
<label for="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1_budget">40000</label>
<output class="bubble" id="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1_budget_bubble"></output><br/>

<!-- guests slider -->
<div class="anchor"><label for="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1_guests">guests:&nbsp;200</label></div>
<input id="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1_guests" type=range min="200" max="400" step="2"
       data-var="guests" data-uuid="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1">
<label for="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1_guests">400</label>
<output class="bubble" id="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1_guests_bubble"></output><br/>

<!-- average_gift slider -->
<div class="anchor"><label for="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1_average_gift">average_gift:&nbsp;250</label></div>
<input id="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1_average_gift" type=range min="250" max="350" step="1"
       data-var="average_gift" data-uuid="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1">
<label for="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1_average_gift">350</label>
<output class="bubble" id="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1_average_gift_bubble"></output><br/>

<!-- guest_price slider -->
<div class="anchor"><label for="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1_guest_price">guest_price:&nbsp;300</label></div>
<input id="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1_guest_price" type=range min="300" max="450" step="1.5"
       data-var="guest_price" data-uuid="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1">
<label for="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1_guest_price">450</label>
<output class="bubble" id="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1_guest_price_bubble"></output><br/>

<!-- extra_cost slider -->
<div class="anchor"><label for="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1_extra_cost">extra_cost:&nbsp;20000</label></div>
<input id="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1_extra_cost" type=range min="20000" max="50000" step="300"
       data-var="extra_cost" data-uuid="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1">
<label for="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1_extra_cost">50000</label>
<output class="bubble" id="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1_extra_cost_bubble"></output><br/>

</div><br/>

<div><p id="ts_610e3bef_a901_4f0d_a45c_56253eeb49a1_error" class="hidden error"></p></div>


kthxbye

<script>
// --------- Global (copy just once if you have multiple groups of sliders) ---------

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

function crossover(x1, x2, crossover_p) {
    return [...new Array(x1.length)].map((x, i) => {
        return Math.random() <= crossover_p ? x1[i] : x2[i]
    });
}

function enforceBounds(x, bounds) {
    for (let i = 0; i < x.length; i++) {
        const currMin = bounds[i][0], currMax = bounds[i][1];
        if (x[i] < currMin) x[i] = currMin;
        else if (x[i] > currMax) x[i] = currMax;
    }

    return x;
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
    const POPSIZE = 20;
    const MAXITER = 210;
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

// --------- Problem-specific ---------

window.onload = function() { 
    bindSpace("ts_610e3bef_a901_4f0d_a45c_56253eeb49a1", ["budget","guests","average_gift","guest_price","extra_cost"], [[0,40000],[200,400],[250,350],[300,450],[20000,50000]],
              "budget + guests * average_gift", "guests * guest_price + extra_cost");

    bindSpace("ts_c1d776aa_2c54_4817_9bba_3cc0341372c7",
              ["popcorn","liquorice"],
              [[0,40],[0,16]],
              "5 * popcorn + 12 * liquorice", "200");

    bindSpace("ts_cb462578_b8b8_4b9c_8d99_5f31fc6d9180",
              ["popcorn","liquorice","wasapeas"],
              [[0,40],[0,16],[0,28]],
              "5 * popcorn + 12 * liquorice + 7 * wasapeas", "200");

    bindSpace("ts_598756e5_96d5_4096_ac44_d997f2f0fc29",
              ["active_users","price","expenses","profit"],
              [[0,10000],[5,50],[50000,200000],[0,50000]],
              "active_users * price", "expenses + profit");
};

</script>