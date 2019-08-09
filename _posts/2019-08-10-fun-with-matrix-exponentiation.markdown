---
layout: post
title:  "Fun with Matrix Exponentiation"
date:   2019-08-01 17:21:33 +0300
categories:
---
Well, _fun_ might be a bit of a stretch, but I'll let you decide for yourself.

Linear algebra was always an integral part of computer science in many fields, including simulation, computer graphics, image processing, cryptography,
machine learning, any many more. As a result most modern computing platforms contain efficient matrix operation libraries, and a lot of hardware exists to make these operations even faster.
These platforms are often very accessible and easy to integrate in most development environments.

This means that whenever a problem can be framed in terms of linear algebra, the solution's performance will usually be better than the naive implementation, especially
in interpreted environments which use specialized linear algebra libraries, such as Python with Numpy, which automatically uses standard linear algebra libraries if they are available.

Of course the fact that a problem _can_ be framed in terms of linear algebra doesn't mean it _should_ be: there is a development overhead for implementing the solution
in linear algebra terms, and of course maintaining the solution would require additional knowledge not all maintainers necessarily have. This is a classic pitfall for premature optimization.
But sometimes an algorithm's bottleneck is some computation which could be reduced to a set of matrix operations, making the entire algorithm run faster.

In this post we'll examine two problems for which a linear algebra approach offers great performance improvement: unit conversion and hierarchical aggregations. Specifically we'll use the operation of _matrix exponentation_:
raising a matrix to some power via repeated multiplication.

### Matrices and graphs
One thing our two problems share in common is the fact that they both conceptually involve graph operations. Graphs can be represented very naturally as [adjacency matrices](https://en.wikipedia.org/wiki/Adjacency_matrix), and it turns out that basic matrix operations, such as multiplication, translate to basic graph operations, such as a single iteration of [breadth-first search](https://en.wikipedia.org/wiki/Breadth-first_search). In this manner we can "translate" the algorithm from an explicit implementation to matrix operation terms.

#### Matrix multiplication as a BFS iteration
Given this graph:

{% include mypage.html %}



### Unit conversion
Suppose we are writing a dynamic program for unit conversion: it takes as initial input some known conversions between units, and allows a user to (try to) convert an amount from one unit
to another. The conversions supplied to the program don't have to be complete, and some conversions might not be possible (e.g. seconds to meters). And of course, we don't
want to explicitly state all legal conversions - if a user specifies a conversion from seconds to minutes and from minutes to hours, the program should be able to convert seconds to hours.
Note that these conversions aren't entirely fixed; for example in general there is no conversion from grams (mass) to ml (volume), but if we're dealing with, say, water, then
`1ml water = 1g water`.

#### Graph solution
Say we are given these conversions:

{% highlight python %}
tbsp -> 3 tsp
cup -> 16 tbsp
kg -> 1000 g
{% endhighlight %}

We can represent the units as nodes in a graph, and the given conversions as directed and weighted edges. Like this:
