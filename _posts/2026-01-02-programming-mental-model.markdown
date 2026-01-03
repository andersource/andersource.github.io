---
layout: post
title:  "Teaching Programming with the aim of Building a Mental Model"
date:   2026-01-03 21:25:00
categories:
image: "assets/programming_mental_model/cat_mental_model.webp"
themecolor: ""
description: "Reflections on programming students' first steps"
hide_thumbnail: true
---

## The Question

For the last 15 years I've had the fortune of accompanying thousands of students as they take their first steps in programming.
From teenagers to career-changers, from one-on-one mentoring to developing curriculums and training materials,
I've had a lot of successes, and a lot of failures, too. The more I teach, the more I learn, the more I find I don't know.

One question in particular has been nagging me almost from the very beginning: why do some students _simply not "get"_ programming?
You might chalk it up to innate intelligence, motivation, or poor explanations on my side, but I've sat with enough smart, highly motivated students, patiently explaining again and again in different ways to no avail, that I think there's something bigger I'm missing - something that just doesn't click for those students, and it takes more than a good explanation to make it land.

I've been brewing with this question for a long time, and finally, in the last few years, an answer has been emerging: my failure has been not actively nurturing a _mental model of programming_. Some (many) students do it naturally, unconsciously, but those who don't are lost without proper guidance.

So that's what this post is about; maybe you think it's obvious, or that I'm missing something else - I'd love to hear! But here we go.

## Mental Model of Programming

What does that even mean?

The term "mental model" is used a lot, in different contexts and meanings, so I want to be careful when explaining what I mean, exactly, by "mental model of programming".

A _model_, in the sense I'm using, is some object that imitates another object to some extent, but is simpler or more manageable.
To the degree that the two objects are similar, the model allows us to conveniently experiment with the dynamics of its more complex sibling.

Thus, a model railroad lets you play with train cars and tracks in your living room, weather forecasts use weather models to simulate how weather systems develop, and language models attempt to emulate the dynamics of human language.

A _mental model_ is a model that sits in your head: machinery in the brain you can use to simulate whatever it's modelling.

A mental model of programming, then, is brain machinery that allows you to simulate how the computer would execute a piece of code - to run this code in your head.

A good mental model of programming is critical for programmers to navigate the huge space of programs they could write.
As you write the code or debug it, you constantly simulate what's hapenning in your head, and compare it to the desired behavior; this guides the process of adding or changing code to achieve your goal. 

![Cat looking at Collatz conjecture code while simulating it](/assets/programming_mental_model/cat_mental_model.webp)

But computer-simulation-machinery doesn't come cheaply to the brain; it requires a lot of practice. Specifically, it requires the brain to _try_ to simulate code, fail, and learn from that.

As I've learned the hard way, while practice is necessary, it's not sufficient: depending on how you teach, there are other ways to learn, and if the learning process doesn't explicitly aim to create a mental model in the students' brain, some students will take the wrong road.

## Another way to learn

Take K-12 education and its equivalents in other countries. In Israel what you're most likely to see is overcrowded classrooms, overworked teachers, and a hyperfocus on getting students to pass their matriculation exams.
Putting aside my general criticism of the system, in my experience this often leads to learning that doesn't involve constructing a mental model of something, even in subjects where that would be appropriate.

This manifests as three levels of performance:

1. Memorization of facts, e.g. the multiplication table
2. Memorization of processes, e.g. solving a quadratic equation with its famous formula
3. Pattern matching, e.g. learning that there are 4 types of problems, memorizing the solution process for each problem, knowing how to identify which problem you're seeing and how to extract variables to substitute in the process

Despite my dismissive tone, this kind of learning isn't inherently wrong, and sometimes it's the only way that makes sense in the context.

But, on its own, it typically doesn't lead to the creation of a mental model, and it doesn't equip students with the (unconscious) ability to rely on mental models when solving problems.
Unlike what you might expect if you look, for example, at the pyramid of [Bloom's taxonomy](https://en.wikipedia.org/wiki/Bloom%27s_taxonomy) of acquisition of cognitive skills, drilling the lower levels of understanding doesn't automatically, at some point, transform into deeper understanding. At least not for _all_ students.

And those students are the ones who struggle. The ones who, no matter how much I explain and how much they feel they understand, sit in front of the IDE and feel completely lost. It's not their fault: I've been talking completely past them. I explained as if they reason about code using a mental model which happens to be wrong, and I'm trying to correct it; but they're operating completely differently.

They try to find patterns in which constructs are used where, copy-paste examples and tweak them; they want the code to do the opposite thing so they try inverting conditions and booleans in areas that seem related. It rarely works.

This is the gap that needs to be addressed, and it's best done before they even start down the wrong path.

## Nurturing a Mental Model of Programming

So what can you do? I'm still learning how to answer this question, but here's what I've got so far.

__Incremental practice__: in my opinion, this is the most important component. When programmers work, their use of the mental model is intense: they simulate a program while keeping track, in their head, of what the desired behavior is; notice when they diverge, and figure out what change to make so they don't.

Asking students to do all that at once is a bit of a leap. I like to specifically drill the mental model, first in straightforward and (relatively) easy ways, then increasingly require usage that resembles real programming.

The progression could look like this:

* **Dry simulation**: Here's some code, here are some inputs, what would be the output?
* **Critical simulation**: Here's some code, what's the high-level description of its behavior? This requires the student to simulate multiple times, trying to find inputs that cover all the branches, and reason about the process, program structure and outputs
* **Modification**: Here's some code that does X, how would you change it to achieve Y? You can create incremental difficulty here too, at first requiring small, local changes, then going bigger
* At long last, **Creation**: Write code that does Z

__Isolate__: learning to program involves, in addition to building a mental model, a lot of technical aspects that can confuse students: working with the IDE, the language's rigid syntax, arcane keywords that don't necessarily carry meaning.

These things aren't necessary for the mental model, so I prefer to keep them for later, starting with river-crossing puzzles and moving on to robots taking natural language instructions in a visual environment. You can go pretty far, conceptually, without introducing a real programming language: variables, conditions, control flow. I'm doing all this with plain old presentations and Kahoot, but today you could use LLMs to create an interactive environment.

__Visual cues__: you can _show_ the students how their internal mental model should look like, for example by doing a dry-run of a program, highlighting the current line (like a debugger), and showing a "watch" table with all the variables. 

__Make shortcuts harder__: Finally, avoid formulaic problems that could be solved using pattern matching or memorization. This will create a vacuum that the brain will want to fill, pushing it to create a mental model.

In this context, I'll mention [Scratch](https://scratch.mit.edu/); it's a rich learning environment that's got some of those principles built-in. I have some reservations about it, but I'll leave that to another discussion. 

I've found that implementing all these, as early as possible, drastically improves student performance.

## Mental Models and AI

AI has been rocking a lot of boats for the last few years, and specifically both programming and education are having some reckoning moments around it. I'm in no position to predict what will happen in the future, but I _am_ worried that reliance on AI in programming education will be yet another shortcut that's actually an obstacle to students' development of a solid mental model of programming (assuming that's still going to matter).

## Mental Models in other areas

Many other domains require, or at least greatly benefit, from having a relevant mental model.

One interesting example I can think of is cooking; you don't _have_ to have a mental model - you could follow recipes, memorize them, and utilize pattern-matching to handle common challenges such as identifying when the batter is mixed enough or how to replace a missing ingredient. That's pretty much my experience with cooking, or at least was until quite recently.

But then I met my wife, who cooks amazing food and, impressively, can improvise wild dishes from what we happen to have available. I came to realize she has a proper mental model of food: she knows how ingredients behave under various conditions and how flavors and textures mix. She acquired this model through years of experimentation, while paying attention to what happens in the process. I've been trying to cook more like that.

Some may call it _good intuition_, and different people may have natural inclinations to develop those for different areas, but I've found the idea of a mental model an interesting lens to reason about how experts approach their work.

I also think about the fraction of students for whom a mental model of programming doesn't come naturally, and how this can be bridged with an appropriate pedagogical approach. What other areas could beneift from something like that? 