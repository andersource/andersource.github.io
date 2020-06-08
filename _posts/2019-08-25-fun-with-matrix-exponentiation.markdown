---
layout: post
title:  "Fun with Matrix Exponentiation"
date:   2019-08-25 17:21:33 +0300
categories:
description: "Exploring the use of matrix exponentation in graph-related problems, and measuring the resulting performance improvement."
image: "/assets/thumbnails/fun_matrix_exponentiation.png"
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
Let's look at this graph:

{% include matrix-exponentiation-fun/graph1.html %}

An all-to-all BFS will find several nontrivial paths (consisting of more than one edge) - A to C, B to D, and A to D.

Now let's look at the graph's adjacency matrix: we have a row and a column for each node. Cell `(i, j)` (row `i`, column `j`) is `1` if there's an edge from node `i` to node `j`, and `0` otherwise.
Since the graph is directed the matrix is not (necessarily) symmetric. Additionally we'll put `1`'s in the main diagonal cells (for reasons which will become clear soon).

$$
\begin{pmatrix}
1 & 1 & 0 & 0 \\
0 & 1 & 1 & 0 \\
0 & 0 & 1 & 1 \\
0 & 0 & 0 & 1 \\
\end{pmatrix}
$$

The node names aren't included in the matrix, but instead are implied by the index, assuming some consistent ordering of nodes, in this case `A, B, C, D`.

This matrix describes, through non-zero elements, all the trivial paths in the graph - A to B, B to C and C to D.

Let's see what happens when we multiply the matrix by itself - i.e. raise it to a power of 2
(you might want to brush up on [matrix multiplication](https://en.wikipedia.org/wiki/Matrix_multiplication)):

$$
\begin{pmatrix}
1 & 1 & 0 & 0 \\
0 & 1 & 1 & 0 \\
0 & 0 & 1 & 1 \\
0 & 0 & 0 & 1 \\
\end{pmatrix} \cdot
\begin{pmatrix}
1 & 1 & 0 & 0 \\
0 & 1 & 1 & 0 \\
0 & 0 & 1 & 1 \\
0 & 0 & 0 & 1 \\
\end{pmatrix} =
\begin{pmatrix}
1 & 2 & 1 & 0 \\
0 & 1 & 2 & 1 \\
0 & 0 & 1 & 2 \\
0 & 0 & 0 & 1 \\
\end{pmatrix}
$$

And we see two new non-zero cells, representing two paths of length 2: A to C and B to D.

Let's multiply again by the original matrix, practically taking the 3rd power of the matrix:

$$
\begin{pmatrix}
1 & 2 & 1 & 0 \\
0 & 1 & 2 & 1 \\
0 & 0 & 1 & 2 \\
0 & 0 & 0 & 1 \\
\end{pmatrix} \cdot
\begin{pmatrix}
1 & 1 & 0 & 0 \\
0 & 1 & 1 & 0 \\
0 & 0 & 1 & 1 \\
0 & 0 & 0 & 1 \\
\end{pmatrix} =
\begin{pmatrix}
1 & 3 & 3 & 1 \\
0 & 1 & 3 & 3 \\
0 & 0 & 1 & 3 \\
0 & 0 & 0 & 1 \\
\end{pmatrix}
$$

And we got another non-zero element, representing the path (of length 3) A to D.

For any graph, continuing in this manner until a multiplication doesn't turn any zero element to non-zero will indicate the exact connectivity of the
graph. That is, from a given node we can know all possible destination nodes for which there's a path in the graph.

The reason we added the identity matrix to the adjacency matrix is that if we used the original adjacency matrix, each successive multiplication
would only reveal the "new" nodes, and we would need to maintain another matrix to represent the graph's connectivity.

There are several additional considerations which I will touch only briefly but deserve attention:
* The "interesting" property of the elements (in this case) was whether or not they were zero. So, unless the result of the multiplication is actually interesting
(which might be the case), we can use a binary matrix to automatically "check" if an element is positive and accordingly place a `0` or a `1` in the result element.
* If we're interested in the length of the path to a certain node, we can examine at each iteration which elements changed from zero to non-zero.
The iteration at which an element changed is the length of the path that the element represents, as in our example.
* Recovering the path itself is a little trickier but certainly possible. First we need to recall that the original BFS offers path recovery by maintaining a "previous"
mapping, noting for each node which node came before it in the path. This mapping is in the context of a single source node. In our all-to-all version the mapping for
any node is done in the context of every possible starting node. We can do this in the following way: whenever we recognize a new path (in the form of an element
turning from zero to non-zero), we multiply, element-wise, the two vectors that were multiplied (with a dot product) to produce said element. Any non-zero node in
the resulting vector can be used as the previous node in the context of the path.
* Conversely, if we're just interested in path existence, and not length or recovery, we can "take bigger steps": instead of multiplying the original matrix by itself every iteration,
we can take higher powers. This could potentially make the calculation even faster for tools that optimize matrix exponentiation.

Next we'll examine two problems where matrix exponentiation, as a tool for all-to-all BFS, could be useful.

### Unit conversion ###
Suppose we are writing a dynamic program for unit conversion: it takes as initial input some known conversions between units, and allows a user to (try to) convert an amount from one unit
to another. The conversions supplied to the program don't have to be complete, and some conversions might not be possible (e.g. seconds to meters). And of course, we don't
want to explicitly state all legal conversions - if a user specifies a conversion from seconds to minutes and from minutes to hours, the program should be able to convert seconds to hours.
Note that these conversions aren't entirely fixed; for example in general there is no conversion from grams (mass) to ml (volume), but if we're dealing with, say, water, then
`1ml water = 1g water`.

#### Graph representation ####
Say we are given these conversions:

{% highlight python %}
tbsp -> 3 tsp
cup -> 16 tbsp
kg -> 1000 g
{% endhighlight %}

We can represent the units as nodes in a graph, and the given conversions as directed and weighted edges. Like this:

{% include matrix-exponentiation-fun/graph2.html %}

Every conversion query is in fact requesting a path in the graph between two nodes, where the conversion ratio is
the multiplication of the weight edges along the path. For example, converting tablespoons to teaspoons is a path
with a single edge, and the ratio is `3`. Converting cups to teaspoons is represented by the path `cup->tbsp->tsp`, and
the ratio is `16 * 3 = 48`. There is no path from kg to cups so we cannot perform that conversion.

Note that given the input the graph we should actually construct
a graph that contains also the inverse edges for the given conversions, with inverse weights.
So converting tablespoons to cups is also possible, with a ratio of `1/16`.

#### Naive solution ####
Here is my naive implementation for an all-to-all BFS for this specific problem. The conversions are parsed
from the format above and passed as a list of conversions of the form `(from-unit, to-unit, ratio)`.

{% highlight python linenos %}
from collections import defaultdict

def add_conversions(mapping, conversions):
	for from_unit, to_unit, amount in conversions:
		mapping[from_unit][to_unit] = amount
		mapping[to_unit][from_unit] = 1. / amount

def expand_conversions(mapping):
	conversions = []
	# If we can go from A to B, and from B to C,
	# then we can get from A to C
	for from_unit in mapping.keys():
		for to_unit in mapping[from_unit].keys():
			for potential_to_unit in mapping[to_unit].keys():
				if (potential_to_unit == from_unit or
				potential_to_unit in mapping[from_unit]):
					continue

				new_ratio = (mapping[from_unit][to_unit] *
				 	mapping[to_unit][potential_to_unit])
				conversions.append((from_unit,
						potential_to_unit,
						new_ratio))

	return conversions

def make_converter(conversions):
	mapping = defaultdict(lambda: {})

	# As long as we are discovering new conversions
	# (including the input conversions)
	while conversions:
		add_conversions(mapping, conversions)
		conversions = expand_conversions(mapping)


	def convert(from_unit, to_unit, amount):
		if from_unit not in mapping:
			return None

		if to_unit not in mapping[from_unit]:
			return None

		return amount * mapping[from_unit][to_unit]

	return convert

{% endhighlight %}

We simply iterate as long as we discover new conversions. At every iteration, after adding the new conversions
to our mapping dictionary (which includes adding the inverse conversions), we search for new potential conversions: for every node A, we iterate all nodes B for which a path `A->B`
exists. For each such node B, we similarly iterate over all nodes C where a path from B to C exists. We then check if a path from A to C
already exists, and if it doesn't, we add it with the total ratio as the multiplication of each of the separate conversions' ratios.

#### Linear algebra solution ####
Since the solution can be reduced to BFS, we can use matrix multiplication as described previously to calculate the conversion matrix.
This time, though, we also need to take into account the edge weights. In this case we need to multiply them, which is perfect for matrix
multiplication. However, another complication will arise from this.

Here is the weighted adjacency matrix of the unit conversion graph above
(including the `1`'s on the main diagonal), for the ordering `cup, tbsp, tsp, kg, g`:

$$
\begin{pmatrix}
1 & 16 & 0 & 0 & 0 \\
\frac{1}{16} & 1 & 3 & 0 & 0 \\
0 & \frac{1}{3} & 1 & 0 & 0 \\
0 & 0 & 0 & 1 & 1000 \\
0 & 0 & 0 & \frac{1}{1000} & 1
\end{pmatrix}
$$

When multiplied by itself the matrix gives:

$$
\begin{pmatrix}
1 & 16 & 0 & 0 & 0 \\
\frac{1}{16} & 1 & 3 & 0 & 0 \\
0 & \frac{1}{3} & 1 & 0 & 0 \\
0 & 0 & 0 & 1 & 1000 \\
0 & 0 & 0 & \frac{1}{1000} & 1
\end{pmatrix}^{2} =
\begin{pmatrix}
2 & 32 & 48 & 0 & 0 \\
\frac{1}{8} & 3 & 6 & 0 & 0 \\
\frac{1}{48} & \frac{2}{3} & 2 & 0 & 0 \\
0 & 0 & 0 & 2 & 2000 \\
0 & 0 & 0 & \frac{1}{500} & 2
\end{pmatrix}
$$

We see two new non-zero elements, representing the conversions `cup->tsp` and `tsp->cup`, with the correct ratios. Hooray!
However, unfortunately we also see that all other non-zero elements have been scaled up by a factor of 2 or more, introducing incorrect ratios to the matrix.
This happens because the matrix multiplication process takes the _sum_ of the element-wise product of a row and a column, resulting in each
element containing the sum of conversions from all possible conversion paths. We can solve this by dividing the matrix (element-wise) by a "helper" matrix which counts
how many paths exist between every two units. This matrix is calculated in exactly the same fashion as the conversion matrix, except it's initialized
with all edge weights as `1`.

In this case, the helper matrix (and its multiplication by itself) would look like this:

$$
\begin{pmatrix}
1 & 1 & 0 & 0 & 0 \\
1 & 1 & 1 & 0 & 0 \\
0 & 1 & 1 & 0 & 0 \\
0 & 0 & 0 & 1 & 1 \\
0 & 0 & 0 & 1 & 1
\end{pmatrix}^{2} =
\begin{pmatrix}
2 & 2 & 1 & 0 & 0 \\
2 & 3 & 2 & 0 & 0 \\
1 & 2 & 2 & 0 & 0 \\
0 & 0 & 0 & 2 & 2 \\
0 & 0 & 0 & 2 & 2
\end{pmatrix}
$$

Then we perform the element-wise division, taking care to ignore elements where the denominator is `0`
(here we are using the standard symbol for [Hadamard division](https://en.wikipedia.org/wiki/Hadamard_product_(matrices)),
which is the formal name of element-wise division):

$$
\begin{pmatrix}
1 & 16 & 0 & 0 & 0 \\
\frac{1}{16} & 1 & 3 & 0 & 0 \\
0 & \frac{1}{3} & 1 & 0 & 0 \\
0 & 0 & 0 & 1 & 1000 \\
0 & 0 & 0 & \frac{1}{1000} & 1
\end{pmatrix}^{2} \oslash \begin{pmatrix}
1 & 1 & 0 & 0 & 0 \\
1 & 1 & 1 & 0 & 0 \\
0 & 1 & 1 & 0 & 0 \\
0 & 0 & 0 & 1 & 1 \\
0 & 0 & 0 & 1 & 1
\end{pmatrix}^{2} =
$$
$$
= \begin{pmatrix}
2 & 32 & 48 & 0 & 0 \\
\frac{1}{8} & 3 & 6 & 0 & 0 \\
\frac{1}{48} & \frac{2}{3} & 2 & 0 & 0 \\
0 & 0 & 0 & 2 & 2000 \\
0 & 0 & 0 & \frac{1}{500} & 2
\end{pmatrix} \oslash \begin{pmatrix}
2 & 2 & 1 & 0 & 0 \\
2 & 3 & 2 & 0 & 0 \\
1 & 2 & 2 & 0 & 0 \\
0 & 0 & 0 & 2 & 2 \\
0 & 0 & 0 & 2 & 2
\end{pmatrix} =
\begin{pmatrix}
1 & 16 & 48 & 0 & 0 \\
\frac{1}{16} & 1 & 3 & 0 & 0 \\
\frac{1}{48} & \frac{1}{3} & 1 & 0 & 0 \\
0 & 0 & 0 & 1 & 1000 \\
0 & 0 & 0 & \frac{1}{1000} & 1
\end{pmatrix}
$$

And voilà! That's exactly the matrix we wanted.

Here is the implementation:

{% highlight python linenos %}
import numpy as np
from numpy.linalg import matrix_power

def make_converter(conversions):
	# Establish consistent unit <-> index mappings
	index2unit = (dict(enumerate(set([c[0] for c in conversions]).
				union([c[1] for c in conversions]))))
	unit2index = {v: k for k, v in index2unit.items()}

	conversion_matrix = np.matrix(np.eye(len(unit2index)))

	# Add known conversions
	for from_unit, to_unit, amount in conversions:
		conversion_matrix[unit2index[from_unit],
			unit2index[to_unit]] = amount
		conversion_matrix[unit2index[to_unit],
			unit2index[from_unit]] = 1./amount

	helper_matrix = (conversion_matrix > 0).astype(int)
	prev_helper_matrix = np.matrix(np.zeros_like(helper_matrix))

	# While we are still discovering new paths
	while (prev_helper_matrix != helper_matrix).any():
		POWER_STEP = 5
		prev_helper_matrix = helper_matrix
		helper_matrix = matrix_power(helper_matrix, POWER_STEP)
		conversion_matrix = \
			(matrix_power(conversion_matrix, POWER_STEP) /
				np.maximum(1., helper_matrix))
		helper_matrix = (conversion_matrix > 0).astype(int)

	def convert(from_unit, to_unit, amount):
		conversion = conversion_matrix[unit2index[from_unit],
						unit2index[to_unit]]
		if conversion == 0:
			return None
		return conversion * amount

	return convert

{% endhighlight %}

We first create a mapping of node name to index (and the inverse mapping), since we are
going to work with row and column indices to represent different nodes. Then we create
the initial conversion matrix, starting from the identity matrix to include `1`'s in the main
diagonal.

#### Comparison ####
The two implementations are about the same length (counting lines of code).

I like how with the naive implementation, a maintainer doesn't even need to know anything about formal graphs to understand both _how_ and _why_ the solution works.

In contrast, to understand the second implementation you need to have an idea of how matrix multiplication works,
know about graphs, why unit conversion is equivalent to pathfinding, and how matrix multiplication can be used as a BFS step. Quite a baggage.

To compare performance, I downloaded a currency conversion XML, chose a couple of "key" currencies, and included conversions of all other
currencies in terms of those key currencies. The full conversion table contains 148 currencies; I also created partial tables with 52 and 12 currencies.
I ran both implementations 5 times on each file, measuring the time to construct the converter (and of course validating it afterwards).
Here are the results:

| &darr; # currencies / avg. runtime (sec) &rarr;|  naive  |  linalg  | linalg faster by |
|---------------------------|---------|---------|-----------------------------|
|12                         |0.000251 |  0.0016 | 0.15 (linalg is slower here) |
|---------------------------|---------|----------|
|52|0.012|0.0028|4.2|
|---------------------------|---------|----------|
|148|0.27|0.015|18|

While there's an initial overhead to using all the matrix representation and operations,
the linear algebra approach seems to scale better than the naive approach.

I think there could be a more efficient implementation of the naive approach, but I suspect that the linear algebra
implementation would still be faster, both asymptotically and practically for relatively large graphs, due to fast matrix multiplication techniques.

### Hierarchical aggregations ###
Let's consider another task. We have Yummly's ["What's Cooking?"](https://www.kaggle.com/c/whats-cooking/data) public dataset, containing some 40k recipes.
Each recipe is classified to a cuisine, and additionally has a list of the recipe's ingredients. In order to better organize the large dataset,
we construct two hierarchies: a cuisine hierarchy and an ingredient hierarchy (containing only "common" ingredients, which appear in at least 100 recipes).

Here is the cuisine hierarchy:
{% highlight python %}
american
	north american
		southern_us
		cajun_creole
		mexican
	caribbean
		jamaican
	south american
		brazilian
asian
	east asian
		chinese
		japanese
		korean
	south asian
		indian
	southeast asian
		thai
		vietnamese
		filipino
european
	southern european
		greek
		spanish
		italian
	eastern european
		russian
	northern european
		british
		irish
	western european
		french
african
	moroccan
{% endhighlight %}

And here's a snippet of the ingredient hierarchy (the full hierarchy contains about 650 nodes):
{% highlight python %}
dairy
	cheese
		shredded cheese
		cream cheese
			cream cheese, soften
		feta cheese
			feta cheese crumbles
		cheddar cheese
			sharp cheddar cheese
			shredded cheddar cheese
			shredded sharp cheddar cheese
		provolone cheese
		parmesan cheese
			fresh parmesan cheese
			grated parmesan cheese
			freshly grated parmesan
		mozzarella cheese
			part-skim mozzarella cheese
			shredded mozzarella cheese
		monterey jack
			jack cheese
			shredded Monterey Jack cheese
		mascarpone
		Mexican cheese blend
		romano cheese
			pecorino romano cheese
		parmigiano reggiano cheese
		ricotta cheese
			ricotta
				part-skim ricotta cheese
		goat cheese
		fontina cheese
		cottage cheese
		queso fresco
		paneer
		cotija
{% endhighlight %}

These hierarchies allow us to generalize some concepts and group them together.

We now want to count cuisine-ingredient combinations, i.e. how many recipes belong to a certain cuisine and contain a certain ingredient.
This aggregation should be done hierarchically: an Italian recipe is also South-European and European, and the ingredient "diced tomatoes"
also counts as "tomatoes" and "vegetables".

#### Naive solution ####
Once again, the naive solution doesn't involve explicitly representing the problem in graph terms.

{% highlight python linenos %}
def aggregate(recipes, cuisine_hier, ingredient_hier):
	# Initialize empty aggregations
	res = {cuisine: {ingredient: 0
		for ingredient in ingredient_hier.keys()}
		for cuisine in cuisine_hier.keys()}

	for recipe in recipes:
		aggregate_recipe(recipe, res,
							cuisine_hier, ingredient_hier)

	def query(cuisine, ingredient):
		return res[cuisine][ingredient]

	return query

def aggregate_recipe(recipe, res, cuisine_hier, ingredient_hier):
	cuisine = recipe['cuisine']
	for ingredient in set(recipe['ingredients']):
		aggregate_ingredient(res, cuisine, ingredient,
								cuisine_hier, ingredient_hier)

def aggregate_ingredient(res, cuisine, ingredient,
							cuisine_hier, ingredient_hier):
	if ingredient not in ingredient_hier:
		return

	# For every cuisine up the hierarchy, for every ingredient up
	# the hierarchy, add 1 to the aggregated count
	curr_cuisine = cuisine
	while curr_cuisine in cuisine_hier:
		curr_ingredient = ingredient
		while curr_ingredient in ingredient_hier:
			res[curr_cuisine][curr_ingredient] += 1
			curr_ingredient = ingredient_hier[curr_ingredient]

		curr_cuisine = cuisine_hier[curr_cuisine]
{% endhighlight %}

The solution is pretty straightforward: for each recipe we iteratively count up the hierarchies.

#### Graph representation ####
Before we look at the linear algebra approach, let's see how this problem translates to graph terms.
The hierarchies are simply trees, with an edge from each node to its parent:

{% include matrix-exponentiation-fun/tree1.html %}

Each cuisine-ingredient pair is directly related to two nodes, and the aggregation involves all nodes to which we can
arrive from those directly related nodes.

#### Ancestry matrices ####
Let's try to calculate that "all nodes to which we can arrive" from a certain node. In the context of hierarchies,
these paths can be interpreted as the "ancestry lineage" of a certain node, i.e. all nodes appearing on the path
from a certain node in the hierarchy tree. This is another instance of a (binary) BFS, which means we can use matrix
exponentiation to find the ancestry matrix. The initial matrix will be the hierarchy matrix: a direct matrix representation
of the hierarchy tree, added to the identity matrix (as in the unit conversion case).

Given the following tree:
{% include matrix-exponentiation-fun/tree2.html %}

The hierarchy matrix (using node order `A, B, C, D, E`) will look like:

$$
\begin{pmatrix}
1 & 0 & 0 & 0 & 0 \\
1 & 1 & 0 & 0 & 0 \\
1 & 0 & 1 & 0 & 0 \\
0 & 1 & 0 & 1 & 0 \\
0 & 1 & 0 & 0 & 1 \\
\end{pmatrix}
$$

Here the rows represent children nodes and the columns parent nodes: thus the element at row 4 (node `D`), column 2 (node `B`) is `1`,
because node `D` is a child of node `B`.

Multiplying the hierarchy matrix by itself yields (with binary multiplication):

$$
\begin{pmatrix}
1 & 0 & 0 & 0 & 0 \\
1 & 1 & 0 & 0 & 0 \\
1 & 0 & 1 & 0 & 0 \\
0 & 1 & 0 & 1 & 0 \\
0 & 1 & 0 & 0 & 1 \\
\end{pmatrix}^{2} =
\begin{pmatrix}
1 & 0 & 0 & 0 & 0 \\
1 & 1 & 0 & 0 & 0 \\
1 & 0 & 1 & 0 & 0 \\
1 & 1 & 0 & 1 & 0 \\
1 & 1 & 0 & 0 & 1 \\
\end{pmatrix}
$$

The resulting matrix additionally contains the information that node `A` is an ancestor of nodes `D` and `E`.
Since the longest path in the tree is of length 2, in this case we are done; in general, as before,
we continue until multiplications don't cause further changes in the matrix.

#### Linear algebra solution ####
Our solution is going to take the following form:
1. Convert the recipe representation to matrix form, generating two matrices: recipe cuisines and recipe ingredients.
2. Create ancestry matrices for the two hierarchies.
3. Using matrix multiplication to calculate the final aggregation.

The conversion to matrix representation will create a matrix with each recipe represented as a row; in
the cuisine matrix, there will be a column for each cuisine and each recipe row will have a `1` in the relevant cuisine.
Similarly, in the ingredient matrix, there will be a column for each ingredient, and each recipe row will have `1`'s in all
relevant ingredients (there could be more than one).

In this case, since we expect the matrices to be sparse, we'll use [scipy's sparse matrices](https://docs.scipy.org/doc/scipy/reference/sparse.html).
For this reason we'll use the `**` operator to take the matrix power instead of numpy's `matrix_power`, as numpy functions often don't work well with sparse matrices.

After converting the representation and creating the ancestry matrices, what's left is a few final multiplications.
If we call the cuisine ancestry matrix `C`, ingredient ancestry matrix `I`, recipe cuisines matrix `Rc` and recipe ingredients `Ri`,
then we can make the following observations:
* Multiplying `Rc` by `C` will yield, for each recipe, all the cuisines it belongs to (including ancestors).
* Multiplying `Ri` by `I` will yield, for each recipe, all the ingredients in the recipe (including ancestors).
* Multiplying the above two matrices (transposing the first) yields, for each cuisine and ingredient pair, how many recipes belong
to that cuisine and contain that ingredient - which is exactly what we want!

So in conclusion the final calculation is:

$$ (Rc \cdot C)^{T} \cdot (Ri \cdot I) $$

And without further ado, here's the full code:

(The `@` operator in Python 3 denotes matrix dot product, though in this case it's not strictly necessary as sparse matrices overload the `*` operator for dot product as well.)

{% highlight python linenos %}
import numpy as np
from scipy.sparse.lil import lil_matrix
from scipy.sparse.csr import csr_matrix

def aggregate(recipes, cuisine_hier, ingredient_hier):
	# Establish consistent node <-> index mappings
	# for both hierarchies
	index2cuisine = dict(enumerate(cuisine_hier.keys()))
	cuisine2index = {v: k for k, v in index2cuisine.items()}

	index2ingredient = dict(enumerate(ingredient_hier.keys()))
	ingredient2index = {v: k for k, v in index2ingredient.items()}

	# Map recipes to cuisine matrix and ingredient matrix
	recipe2cuisine = \
		recipe_cuisines(recipes, cuisine2index).astype(int)
	recipe2ingredient = \
		recipe_ingredients(recipes, ingredient2index).astype(int)

	# Create cuisine ancestry matrix
	cuisine_hier_mat = \
		construct_hierarchy_matrix(cuisine_hier, cuisine2index)
	cuisine_ancestry_mat = \
		construct_ancestry_matrix(cuisine_hier_mat).astype(int)

	# Create ingredient ancestry matrix
	ingredient_hier_mat = \
		construct_hierarchy_matrix(ingredient_hier, ingredient2index)
	ingredient_ancestry_mat = \
		construct_ancestry_matrix(ingredient_hier_mat).astype(int)

	# Aggregate
	counts = (recipe2cuisine @ cuisine_ancestry_mat).T @ \
				(recipe2ingredient @ ingredient_ancestry_mat)

	def query(cuisine, ingredient):
		return counts[cuisine2index[cuisine],
					ingredient2index[ingredient]]

	return query

def construct_hierarchy_matrix(hierarchy, node2index):
	N = len(hierarchy)
	hier_mat = lil_matrix(np.eye(N), dtype=bool)
	for child, parent in hierarchy.items():
		if parent is None:
			continue

		hier_mat[node2index[child], node2index[parent]] = 1.

	return csr_matrix(hier_mat)

def construct_ancestry_matrix(hierarchy_matrix):
	ancestry_matrix = hierarchy_matrix
	POWER_STEP = 5
	while True:
		new_ancestry_matrix = ancestry_matrix ** POWER_STEP
		if not (new_ancestry_matrix != ancestry_matrix).max():
			return new_ancestry_matrix

		ancestry_matrix = new_ancestry_matrix

def recipe_cuisines(recipes, cuisine2index):
	recipe2cuisine = np.zeros((len(recipes), len(cuisine2index)))
	for i, recipe in enumerate(recipes):
		recipe2cuisine[i, cuisine2index[recipe['cuisine']]] = 1.

	return csr_matrix(recipe2cuisine, dtype=bool)

def recipe_ingredients(recipes, ingredient2index):
	recipe2ingredients = np.zeros((len(recipes),
								len(ingredient2index)))
	for i, recipe in enumerate(recipes):
		for ingredient in recipe['ingredients']:
			if ingredient in ingredient2index:
				recipe2ingredients[i,
				 	ingredient2index[ingredient]] = 1.

	return csr_matrix(recipe2ingredients, dtype=bool)

{% endhighlight %}

#### Comparison ####
First, we see that in this instance the linear algebra solution requires much more code to implement,
and is again much less intuitively understandable.

Regarding performance, on my machine, the naive approach (on the full training set available on Kaggle) takes about 0.9 seconds on average,
while the linear algebra approach takes about 0.48 seconds. An improvement indeed, but the factor is not very impressive.
However, I also separately timed the matrix operations (excluding the representation conversion), and they took only about 0.045 seconds on average.
So most of the overhead in the linear algebra approach can be eliminated if we maintain the data in the appropriate format,
to get, in this case, an improvement factor of about 20x. Neat!

#### Other use cases ####
This method is useful in several other similar situations:
* When we already have a matrix with the aggregated amounts for leaf nodes, and we just want to aggregate to non-leaf nodes.
* When we have a more complicated relationship graph which can be represented as a DAG (directed acyclic graph). In this case the initial hierarchy matrix (used for
calculating the ancestry matrix) should be the graph representation of the DAG, in a similar manner to the tree representation.

### Conclusions ###
In this post we explored how matrix multiplication can be used to calculate graph BFS operations, and examined two cases where using matrix operations speeds up
computation (at the expense of clarity): unit conversion and hierarchical aggregations. In both cases, for large enough scales (and using the proper representation)
the speedup is by an order of magnitude. In addition, algorithms based on matrix multiplication can further be scaled up with hardware - utilizing GPUs and parallelizing computation.

### More stuff ###
All the code for the examples can be found [here](https://github.com/andersource/matrix-exponentiation-fun).

[Graph BLAS](http://graphblas.org/index.php?title=Graph_BLAS_Forum) is a large-scale open effort at creating standardized primitives for graph algorithms in the language of linear algebra.

[This book](https://bookstore.ams.org/stml-53) details many applications of linear algebra in computer science and other areas of mathematics.
Interestingly, some of the algorithmic applications offer the best known polynomial runtime for the given tasks.
