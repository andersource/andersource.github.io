---
layout: post
title:  "Calculus Phobic's Introduction to Differentiable Programming"
date:   2025-06-26 21:10:00
categories:
image: "/assets/diffprog-intro/optimization.webp"
themecolor: ""
description: "You don't have to be a Rocket Scientist to Optimize!"
image_style: "cover"
hide_thumbnail: true
---

### You've found yourself in a pickle

You need to cross from point A to point B as fast as possible. Geometry dictates that the shortest path is a straight line, but since you’re crossing different terrains at different speeds, the fastest path will not be a straight line.

![Illustration of the optimal terrain-crossing problem](/assets/diffprog-intro/problem.webp)

### First thoughts

Any reasonable solution can be characterized by two numbers, denoted $$ x_1 $$ and $$ x_2 $$, describing where we cross the boundaries between different terrains.
Given all the information, it’s not difficult to calculate the total time to cross, using the Pythagorean theorem and the equation $$ distance = speed \cdot time $$:

$$ t = \frac{\sqrt{ {x_1}^2 + d^2}}{v_1} + \frac{\sqrt{ {x_2}^2 + d^2}}{v_2} + \frac{\sqrt{(h - x_1 - x_2)^2 + d^2}}{v_3} $$

But how to find $$ x_1 $$ and $$ x_2 $$ that minimize $$ t $$?  Your old calculus professor would suggest computing the gradient and solving a system of equations, but honestly you’d rather kiss a sulphurous frog. Sampling lots of points and picking the best is possible, but inexact and expensive.

### Differentiable Programming to the Rescue

Fueled by optimization techniques for deep learning models, the last decade saw an explosion of automatic differentiation engines in Python: libraries that allow you to write numeric code in almost-pure Python, and automatically compute derivatives and gradients.    How does this help us? A function’s gradient tells us in which direction the function is increasing the most. So if we want to minimize it, we can flip the gradient’s sign and just follow that! That’s the essence of the [gradient descent algorithm](https://en.wikipedia.org/wiki/Gradient_descent).

### Getting out of our pickle with [JAX](https://docs.jax.dev/en/latest/index.html)

{% highlight python %}

from jax import grad
from jax.numpy import sqrt

h, d, v1, v2, v3 = 20, 10, .7, .3, .45

def calc_time(x):
    x1, x2 = x
    return (
        sqrt(x1 ** 2 + d ** 2) / v1
        + sqrt(x2 ** 2 + d ** 2) / v2
        + sqrt((h - x1 - x2) ** 2 + d ** 2) / v3
    )

d_time_d_x = grad(calc_time)  # Magic!
x1, x2 = 2., 17.
step = 1.5

for i in range(20):
    dx1, dx2 = d_time_d_x([x1, x2])
    x1 -= step * dx1
    x2 -= step * dx2

print(f"{x1=}, {x2=}")

{% endhighlight %}

### Visualizing the optimization process

We can visualize the objective landscape, and show the path our optimization traces through it:

<div style="text-align: center;">
    <img src="/assets/diffprog-intro/landscape.webp"
     style="margin: 2em auto; width: 60%;"
     alt="Gradient descent in the optimization landscape"
    />
</div>

Looking at the objective itself along the optimization, we can see it consistently improving (though the rate of improvement is slowing down):

<div style="text-align: center;">
    <img src="/assets/diffprog-intro/objective.webp"
     style="margin: 2em auto; width: 60%;"
     alt="The improving objective"
    />
</div>

Finally, we can visualize the actual paths represented by the parameterized solutions as we optimize:

<div style="text-align: center;">
    <img src="/assets/diffprog-intro/optimization.webp"
     style="margin: 2em auto; width: 80%;"
     alt="Finding iteratively better paths with differentiable programming"
    />
</div>

### How does this work?

You might be wondering how JAX computes the gradient behind the scenes. Maybe it's using numeric approximations? Or parsing the code and symbolically working out the gradient? Actually, neither!

A full explanation of [automatic differentiation](https://en.wikipedia.org/wiki/Automatic_differentiation) is out of scope for this intro, but I'll try to convey the main ideas succinctly.

Look at this simple computation:

{% highlight python %}
z = x ** 2 + y / 2
{% endhighlight %}

If `x` and `y` were pure Python numbers, then `z` would also be a number, and contain no trace of the computation that led to its current value.

But, using [operator overloading](https://en.wikipedia.org/wiki/Operator_overloading) (["special method names"](https://docs.python.org/3/reference/datamodel.html#special-method-names) in Python), you can create types that keep track of computations, and use them to obtain expression trees for the values you compute:

<div style="text-align: center;">
    <img src="/assets/diffprog-intro/simple_graph.png"
     style="margin: 2em auto; width: 50%;"
     alt="Simple expression tree of above computation"
    />
</div>

Here is the expression tree for the time calculation that we want to optimize:

<div style="text-align: center;">
    <img src="/assets/diffprog-intro/t_graph.png"
     style="margin: 2em auto; width: 80%;"
     alt="Expression tree of time-to-cross calculation"
    />
</div>

Next, and this is where (some of) the magic happens, thanks to the [chain rule](https://en.wikipedia.org/wiki/Chain_rule) in calculus and its generalizations,
you can use this tree to efficiently compute the derivative of the final node with respect to any other node in the tree.

I won't go into more detail than that - it's a calculus _phobic's_ introduction, after all - but I hope this sates your curiosity for now, and I've added links with more information below.

### Is it really that easy?

The ability to effortlessly, and _efficiently_, calculate gradients of arbitrary functions is very powerful for gradient-based optimization.

However, as you might expect, there are a few subtleties:

#### Operations supporting custom types
Since we're using custom types for building the computation graph and calculating gradients, we need to use operations that support those types. Operator overloading allows us to support arithmetic out-of-the-box, but for more complicated computations you'll need to use the appropriate implementation (or implement it yourself if it doesn't exist). Hence the use of the custom `jax.numpy.sqrt` function.
  
The good news is that many modern automatic differentiation engines come with a big library of common operations and algorithms already implemented, so what you need is most likely there - and if it's not, you'll have plenty of primitives to build on.

#### Optimization landscape navigation
The simple path-planning problem I presented has a simple "optimization landscape", where from every point it's fairly easy
to improve solutions. And still there was some tuning - choosing the step size and number of iterations. Such aspects will always require attention,
and more complex problems may have landscapes that are trickier to optimize on.

Another potential issue is that of converging to local optima - depending on the problem, this may be acceptable, or require
clever initialization or other tricks to avoid.

#### Time and space resources

While the algorithm for computing gradients is efficient, there's still significant overhead to computing gradients, both
in time and in memory. If you have an extra-large problem you might need to take care when optimizing it, or find a way to break it down to smaller sub-problems.

### What more can you do?

OK, so we know how to optimize simple computations with differentiable programming. Anything else of interest we can do with it?

#### Differentiating through branching and loops

Since the computational graph is built on-the-fly with our custom types, it doesn't "care" if computations happen in
a straightforward, branchless block of code (like in our example) or through a winding path of conditions and loops. As long as we can construct 
a graph, we can calculate gradients (within the computer's resources constraints, of course.)

#### Differentiating through conditions?

While constructing the computational graph within branches or loops isn't an issue, if we want the optimiation
to include the _conditions_ that determine those branches - well, that's tricker. Still possible, though!

Suppose our computation goes through a simple `if-else` branch, and we want the `if`'s condition to be included in the optimization.

The computational graph only includes calculations that happened. So, say we choose the `else` branch - the computation wouldn't "know"
what could have happened had we taken the `if` branch.

To resolve that, we need to run _both_ branches, and average them in a way that reflects the condition's preference. The same is true for `while` and `for` loops, with slight variations.

I don't want to go too deep, but [this](https://hardmath123.github.io/conways-gradient.html) is a _lovely_ example of reversing Game of Life with differentiable programming and the branch-weighting idea.

#### Integrating with machine learning models

The proliferation of differentiable programming frameworks in Python was pretty much kickstarted with frameworks for training
deep learning models, also using gradient-based optimization techniques. This typically makes plugging such models to differentiable
computations very easy! For instance, JAX has the [Flax neural network library](https://github.com/google/flax).

An example application of such integration is training [physics-informed neural networks](https://www.mathworks.com/discovery/physics-informed-neural-networks.html).

#### Differentiable packages

In addition to the built-in operations that come with automatic diffentiation frameworks, there's a growing ecosystem of
fully differentiable implementations of more advanced operations in various domains.

Examples include: [3D rendering](https://developer.nvidia.com/kaolin), [computer vision](https://github.com/kornia/kornia), [signal processing](https://magenta.tensorflow.org/ddsp), and more.

These packages can be incorporated to differentiable pipelines to create very interesting tools.

### What is differentiable programming good for?

Automatic differentiation [has been around much longer](https://www.autodiff.org/?module=Publications&submenu=list%20publications&order=year&search[letter]=A) than its presence in the Python ecosystem, with applications primarily in science and engineering design optimization.
The recent surge of automatic differentiation frameworks in Python brings this powerful tool to a much broader audience.

Most recently, [Gaussian Splatting](https://en.wikipedia.org/wiki/Gaussian_splatting), which is based on differentiable programming, has exploded in popularity, and is seeing impressive adoption as a 3D scene representation format.

Personally, for the last several years I've been working with a startup on 3D reconstruction with differentiable rendering. Also, [image color replacement with numerical optimization](https://andersource.dev/2021/06/12/image-color-replacement.html) from a few years ago would have been
a classic use case for differentiable programming (except it was a project for a course, so I worked out the gradients by hand. Oh, what joy.)


### Diving deeper

[This video](https://www.youtube.com/watch?v=wG_nF1awSSY) is a great introduction to automatic differentiation, and [this post](https://e-dorigatti.github.io/math/deep%20learning/2020/04/07/autodiff.html) walks through implementing automatic differentiation from scratch.

[This](https://indico.cern.ch/event/1022938/contributions/4487279/attachments/2303715/3918954/differentiable-programming-and-design-optimization%20(1).pdf) is an extensive, if a bit technical, introduction to differentiable programming.

The [JAX tutorials](https://docs.jax.dev/en/latest/tutorials.html) will get you up to speed on implementing differentiable computations.

I've also considered doing a series of differentiable programming exercises, gradually introducing concepts and tools. I think it could be really cool, with animations visualizing the optimization process. But it takes a lot of work, and I could use some motivation - ping if that's something you'd be interested in!  

### Scipy 2025 Virtual Poster

The first part of this post was adapted from a poster I made for the virtual session at [Scipy 2025](https://www.scipy2025.scipy.org/). Click to view at full resolution:

<a href="/assets/diffprog-intro/scipy_poster.png" target="_blank">
![Scipy 2025 poster on introduction to differentiable programming](/assets/diffprog-intro/scipy_poster_small.webp)
</a>