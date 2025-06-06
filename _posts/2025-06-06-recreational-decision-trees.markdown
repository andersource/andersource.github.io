---
layout: post
title:  "Recreational Image Reconstruction with Decision Trees"
date:   2025-06-06 14:30:00
categories:
image: "/assets/recreational-decision-trees/sunset.webp"
themecolor: "#"
description: "And how code got involved in my wedding"
image_style: "cover"
hide_thumbnail: true
---

A couple of months ago I got married! Very exciting, and a great excuse to complicate things by writing code.

We had the idea to use pictures we've taken in our trips for some of the aesthetic design - as backgrounds for the invitation, menus
and so on. I remembered seeing once an animation of a recursive subdivision of an image, with gradual
refinement of high-detail areas, which seemed really neat. It reminded me of the way [decision trees](http://www.r2d3.us/visual-intro-to-machine-learning-part-1/) subdivide the feature space, and I thought it would be cool
to try to reconstruct the image with a decision tree with limited depth, using pixels' X- and Y-coordinates as features.

My wife took this picture of a beach sunset:

<div style="text-align: center;">
    <img src="/assets/recreational-decision-trees/sunset_original.webp"
     style="margin: 2em auto; width: 80%;"
     alt="Picture of a beach sunset"
    />
</div>

I fed it to a simple decision tree, where we try to predict RGB from X and Y:

<div style="text-align: center;">
    <img src="/assets/recreational-decision-trees/rectangle.webp"
     style="margin: 2em auto; width: 80%;"
     alt="Abstract, rectangular version of the beach sunset photo"
    />
</div>

It's nice, but a bit too blocky for me. Of course, that's a direct consequence of how we feed the data to the decision tree algorithm: it has to make thresholds on X- and Y-coordinates of pixels, so of course the apprpoximation will be built out of rectangles.

Maybe we can use a different representation to get a different style?

I tried sampling points in image space using [Poisson Disk Sampling](https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf) and representing each pixel by its distances from all anchor points:

<div style="text-align: center;">
    <img src="/assets/recreational-decision-trees/sunset.webp"
     style="margin: 2em auto; width: 80%;"
     alt="Abstract, rounder version of the beach sunset photo"
    />
</div>

_Now_ we're talking! I liked that style a lot, and happily my wife did too, so we ended up using variations of this technique on several of our pictures for various wedding-related graphics.

There are _a lot_ of parameters and variations to play with here - anchor sampling density, decision tree depth, whether to use the same points for all RGB channels or different ones, and so on. So far my impression is that each picture has its own parameter spaces that work well with it, so there's a lot of experimentation involved.

Here's the result of a different sunset picture, with a stricter limitation on maximum tree depth - looks very abstract:

<div style="text-align: center;">
    <img src="/assets/recreational-decision-trees/abstract_simple.webp"
     style="margin: 2em auto; width: 100%;"
     alt="Abstract picture with sunset colors in geometric style"
    />
</div>

Here's the same picture with similar maximum depth limit, but reconstructed with a [random forest](https://en.wikipedia.org/wiki/Random_forest) instead:

<div style="text-align: center;">
    <img src="/assets/recreational-decision-trees/abstract_soft.webp"
     style="margin: 2em auto; width: 100%;"
     alt="Abstract picture with sunset colors in geometric style, softer"
    />
</div>

A bit noisier, but also softer - I like both versions, each with its own flavor.

Another cool trick is to use a picture with some object in it, segment the object (manually or with [SAM](https://github.com/huggingface/segment-anything-2)) and give it a higher `sample_weight` when fitting the model. This will cause the tree to give more importance to those areas of the picture, resulting in higher fidelity, while the background remains more abstract:

<div style="text-align: center;">
    <img src="/assets/recreational-decision-trees/rings.webp"
     style="margin: 2em auto; width: 100%;"
     alt="Abstract picture with wedding rings on a table"
    />
</div>

The same idea can be applied to pictures with faces. I played with using face landmark detection (with the [face-alignment](https://github.com/1adrianb/face-alignment) library) to determine pixel importance, with pretty cool results - our faces are recognizable but still abstract:

<div style="text-align: center;">
    <img src="/assets/recreational-decision-trees/faces.webp"
     style="margin: 2em auto; width: 80%;"
     alt="Abstract picture of couple looking at each other"
    />
</div>

I also played with generating an animation of a picture "coming into focus" by gradually varying the parameters:

<div style="text-align: center;">
    <video controls src="/assets/recreational-decision-trees/flowers.mp4"
     style="margin: 2em auto; width: 100%;"
    />
</div>

As you can see, I'm having a lot of fun with this technique! There are many more ideas I'd like to try, but I'll leave it here for now.

You can find sample code for the basic idea [here](https://gist.github.com/andersource/ec223ed6a1e9cdeb59770404a086e1e8).

Cheers!
