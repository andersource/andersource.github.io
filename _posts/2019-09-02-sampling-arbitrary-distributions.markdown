---
layout: post
title:  "Sampling arbitrary probability distributions"
date:   2019-09-02 00:00:00 +0300
categories:
description: "Transforming a uniform distribution to an arbitrary probability distribution"
image: "/assets/thumbnails/arbitrary_distributions.webp"
themecolor: "lightyellow"
---
The universe we live in is, to the best of our (current) computational capabilities, wildly non-deterministic.
Until the advent of computers, any desire for determinism had to be sated with the imagination, by defining and manipulating mathematical objects.
Then came along machines that enabled us to specify processes that would carry on with unprecedented determinism, and we _loved_ it.
But even in those machines we couldn't do without a sprinkle of non-determinism, so we added [pseudorandom number generators](https://en.wikipedia.org/wiki/Pseudorandom_number_generator)
and [true random number generators](https://www.random.org) (and also [this](https://xkcd.com/221/)).

### Manipulating randomness ###
While most programming languages provide primitives for sampling from random distributions, sampling from your distribution of choice might require some work.

For example, C has `rand()` which generates an integer between 0 and `RAND_MAX`. To generate an integer within the constrained range `(min, max)` we use
`rand() % (max - min + 1) + min`. This is a trivial example, but it wasn't trivial to me when I first learned it, and the fascination with transforming random numbers has stuck.

Many languages and libraries provide functions for sampling non-uniform distributions, such as the normal distribution. These functions all rely on a source of uniform random numbers,
and use some method to convert the uniform distribution to the desired distribution. One of the most general methods to convert uniformly-generated numbers in the range `[0, 1]`
to any probability distribution (both discrete and continuous) is [inverse transform sampling](https://en.wikipedia.org/wiki/Inverse_transform_sampling).
We'll get to how it works right after the fun part.

### The fun part ###
This is actually the reason for the post. Here you can draw whatever discrete probability distribution you like, and sample from it!
Just draw like in a paint program (the dynamic is a bit different because we're drawing a function). You can choose from several initial distributions.
(This part is best viewed on desktop).

{% include arbitrary-distribution-sampler/sampler.html %}

### Inverse transform sampling ###
Let's develop the idea behind this sampling technique.

First, suppose you want to randomly select one out of four objects, `A, B, C, D`, uniformly. Easy: just sample a uniform random number in the range `[0, 1]`.
If it's between 0 and 0.25, select `A`; if it's between 0.25 and 0.5, select `B`; etc.

Now suppose we have different probabilities for each object, for example `A: 0.7, B: 0.2, C: 0.08, D: 0.02`. Again we can use a uniform random number; if it's between
0 and 0.7, select `A`; if it's between 0.7 and 0.9, select `B`; if it's between 0.9 and 0.98, select `C`; otherwise select `D`.

Notice how the test boundaries correspond to cumulative sum elements of the probability distribution? This cumulative sum series is called a CDF - cumulative distribution function.
Its value at a certain point, _x_, represents the probability that a random sample from that distribution will be less than or equal to _x_.

_Inverse sampling_ the CDF means asking, for a given probability _y_, at what _x_ does the CDF have a value of _y_?

#### Example ####
We have this probability distribution:
![Some probability distribution](/assets/arbitrary-distribution-sampler/pdf.jpeg)

Then its CDF would be:
![Above distribution's CDF](/assets/arbitrary-distribution-sampler/cdf1.jpeg)

To sample a random number from this distribution, we randomly place a horizontal line, and take the _x_ value where it intersects the CDF:
![Inverse sampling the CDF](/assets/arbitrary-distribution-sampler/cdf2.jpeg)

Finding the corresponding x for a sampled probability can be done relatively efficiently (_O(logn)_) with a binary search, as the CDF is a non-decreasing series.


### Effect size and sample size ###
Choose the "skyline" distribution, and play with the sample size a bit. Try to find, for each skyline feature, the minimum sample size required to distinguish that feature.
We see that the smaller the feature is, the larger the sample size required to distinguish that feature.

To me this really illustrates the necessity for large sample sizes when measuring weak effects: when the sample size is too small,
the noise is about as large as (or larger than) the effect.


Code for the interactive part of this post can be found [here](https://github.com/andersource/arbitrary-distribution-sampler).
