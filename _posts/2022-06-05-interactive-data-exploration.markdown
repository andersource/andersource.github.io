---
layout: post
title:  "Interactive data exploration"
date:   2022-06-05 19:30:00 +0300
categories:
themecolor: "#eaeaf4"
image: "/assets/thumbnails/interactive_exploration_nyc_taxi.webp"
description: "Creating interactive data exploration utilities with dimensionality reduction and D3.js"
hide_thumbnail: true
---
One of the first priorities when approaching a new data task is getting to know the data,
and visualizations are an integral part of the process.
For me, interactive visualizations (with libraries such as [plotly](https://plotly.com/python/), [bokeh](https://docs.bokeh.org/en/latest/docs/gallery.html#standalone-examples) or [d3.js](https://observablehq.com/@d3/gallery))
are especially powerful in bringing the data "closer" and making it almost physically tangible. 

In a few distinct cases, the standard visualizations weren't enough for
me to feel I properly grok the data, and I wanted something more. In those cases I ended up creating
custom interactive visualizations to explore the data. A key aspect of those visualizations was that
they contained _all the samples_ in some condensed form, a way to interact with the samples, and
additional visualizations that accompany the interaction.

In this post I'll walk through a demo of such a utility, to explore data of taxi rides in NYC.

### Skip to the demo
If you're on desktop, you can go ahead and try the demo [here](/assets/int-x-nyc-taxi/index.html), though I'd recommend skimming the post to
understand what's going on.

## NYC taxi dataset
In the demo you can explore a small subset (a little less than 10K)
of the [New York City Taxi Ride Dataset](https://www.kaggle.com/competitions/nyc-taxi-trip-duration/data)
from 2016, downloaded from Kaggle. An extensive exploratory data analysis of the dataset
(with the goal of predicting the ride duration, as per the Kaggle competition),
by Kaggle user [Heads or Tails](https://www.kaggle.com/headsortails), can be found
[here](https://www.kaggle.com/code/headsortails/nyc-taxi-eda-update-the-fast-the-curious).

The features I focused on in the demo are:
* Pickup location (latitude and longitude)
* Dropoff location
* Pickup time (day, hour)
* Ride duration

Here are a few samples from the dataset:

<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th>pickup_day</th>
      <th>pickup_time</th>
      <th>duration_hours</th>
      <th>pickup_lon</th>
      <th>pickup_lat</th>
      <th>dropoff_lon</th>
      <th>dropoff_lat</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>3</td>
      <td>7.68</td>
      <td>0.31</td>
      <td>-73.96...</td>
      <td>40.78...</td>
      <td>-73.98...</td>
      <td>40.76...</td>
    </tr>
    <tr>
      <td>4</td>
      <td>9.83</td>
      <td>0.37</td>
      <td>-73.95...</td>
      <td>40.78...</td>
      <td>-73.98...</td>
      <td>40.74...</td>
    </tr>
    <tr>
      <td>0</td>
      <td>22.02</td>
      <td>0.11</td>
      <td>-73.99...</td>
      <td>40.72...</td>
      <td>-73.99...</td>
      <td>40.73...</td>
    </tr>
    <tr>
      <td>1</td>
      <td>15.82</td>
      <td>0.02</td>
      <td>-73.91...</td>
      <td>40.77...</td>
      <td>-73.91...</td>
      <td>40.77...</td>
    </tr>
    <tr>
      <td>0</td>
      <td>13.97</td>
      <td>0.13</td>
      <td>-73.98...</td>
      <td>40.76...</td>
      <td>-74.00...</td>
      <td>40.76...</td>
    </tr>
  </tbody>
</table>

## Dimensionality reduction
My primary approach for including all samples in the visualization is using some [dimensionality reduction](https://en.wikipedia.org/wiki/Dimensionality_reduction) technique.

For the demo I used [UMAP](https://umap-learn.readthedocs.io/en/latest/), which gave the following 2D embedding of the rides:
![2D embedding of 10K taxi ride samples](/assets/int-x-nyc-taxi/post-figures/dim_reduction.webp)

## Interactive exploration
The interactive exploration utility is composed of two main areas: a visualization of the embedded samples, and another section with visualizations of the interactions.
![Annotation of the interactive exploration utility](/assets/int-x-nyc-taxi/post-figures/int_x_annotation.webp)

The sample area supports zoom and pan.

The "side" visualizations show the distributions of features for the full dataset as well as for highlighted samples:
* Map of all pickup-dropoff pairs
* Count plot for days
* Histograms for time and duration
* Compass-like arrows for showing the dominant ride direction

### Sample and selection inspection
Two related modes involve highlighting a set of samples, and visualizing the feature distributions of the selection
compared to the full dataset.

One mode (which I coined "inspection", the one with the magnifying glass icon) provides highlighting by hovering.
![Animation of using hover to highlight samples and view subsample distribution](/assets/int-x-nyc-taxi/post-figures/int_x_hover.gif)

The other mode ("selection", brush icon) provides highlighting by selecting samples with a brush (by pressing the ctrl/cmd keys).
![Animation of using brush to highlight samples and view subsample distribution](/assets/int-x-nyc-taxi/post-figures/int_x_brush.gif)


Using these we can quickly see that UMAP created a big blob for each day of the week, with some smaller blobs
for specific types of rides.

The day-blobs are organized such that across their length they correspond to the pickup time, and the
perpendicular directions roughly corresponds to pickup / dropoff location in Manhattan.

Each day-blob has a slightly separated portion for late-travellers from the day before (or very early?), 
with the size of the portion increasing as we get closer to the weekend.

Additionally, there are some smaller blobs for airport rides (JFK and LGA),
some of which are also organized by time of day; these blobs seem to be split by:
* to / from for JFK (as indicated by the direction arrows)
* day of week for LGA
  * Interestingly, the weekend rides from LGA have been annexed to the rest of Sunday's rides
  * Also interesting to note that rides to LGA have been mixed with the rest of the rides (unlike rides to JFK, which have a blob of their own)

The peculiarities can indicate interesting patterns in the data, but they can also be a result of the
way the chosen dimensionality reduction technique works (more on that soon).


### Projection tool
The projection tool (enabled only when samples are selected with the brush) allows us to specify an axis
and observe how the selected samples project onto the axis, by coloring them and showing a scatterplot
of pickup time and duration by projection.

![Animation of using brush to highlight samples then projection to view sample projection onto chosen axis](/assets/int-x-nyc-taxi/post-figures/int_x_projection.gif)

This allows us to inspect the way blobs are organized, more easily than the hover inspection tool.


## Discussion and variations
It is evident that the exploration hinges on the dimensionality reduction; a random projection, for example,
would be no better (and arguably worse) than looking at random subsets of the data. Thus it's important
to choose a proper dimensionality reduction approach, and maybe even provide interactivity of the dimensionality reduction itself.

Some approaches to dimensionality reduction:
* Playing with different DR techniques (e.g. see [scikit-learn's page on manifold learning](https://scikit-learn.org/stable/modules/manifold.html) or [PyMDE](https://pymde.org/))
* Giving different weights to different features (up to completely removing features)
before running through a DR technique
  * This can be done interactively (though might require lots of pre-computation or fast realtime-ish DR)
* If sample similarity is easy to obtain, can use [multidimensional scaling](https://en.wikipedia.org/wiki/Multidimensional_scaling) or
[matrix factorization](https://en.wikipedia.org/wiki/Matrix_factorization_(recommender_systems))
* If there's a DL model involved, can use DR on last layer representations

The main sample area doesn't have to be a 2D embedding of the samples either. In one project with
[compositional data](https://en.wikipedia.org/wiki/Compositional_data) we used DR to 1 dimension (PCA),
and displayed the samples as a stacked percentage chart.

Another bunch of interactive tools could allow the user to filter or highlight samples according to
some criteria. This can enable a sort of ping-pong game of generating hypotheses by highlighting samples
and validating them by applying criteria and inspecting the resulting patterns.

## Empowering other roles in the org
Apart from using such utilities myself to play with the data, these tools were of interest to other people in the team:
* When the data was navigation flow through a mobile app, the product manager used
the utility to gain a better understanding of user experience and behavior
* When the data was user interaction with content items, content moderators used
the utility to understand the items as experienced by users, and uncover specific issues with certain items
that led to unexpected behavior

Of course, hacking something for your own usage is very different from developing a tool
used by other people (even if it's for internal use only), so there's obviously an effort trade-off here.


## Performance considerations
Naturally, when visualizing large datasets, performance can be an issue, even a blocker.

Some tricks that can be used for performance:
* Dividing the data into pre-filtered subsets 
* Not re-calculating the full subset stats but updating them based on added / removed samples
* Using an appropriate data structure (e.g. [k-d tree](https://en.wikipedia.org/wiki/K-d_tree) et al.) for detecting selected samples
* Moving heavy operations server-side
* Utilizing GPU with WebGL or, hopefully soon, WebGPU - e.g. see [this great post](https://blog.scottlogic.com/2020/05/01/rendering-one-million-points-with-d3.html)

It's important to choose the right sort of interactivity for the tools.
For example, if calculating subset distributions took a long time, doing that
for every mouse move would have been a very bad idea, and a better choice could have been
box or lasso selection.


## Code & Disclaimers
Code for the demo can be found [here](https://github.com/andersource/andersource.github.io/tree/master/assets/int-x-nyc-taxi).

I'm not a frontend dev, and hacked this demo over a few weekends, so some disclaimers:
* The code could certainly use a refactor, there's a lot of global state management, code duplication etc.
* Might not look good or work smoothly on different browsers / screens
* There are probably a few bugs lurking around
* The design could use some refinement

Overall though I'm pretty happy with how it turned out.


## Call for interesting data
I'm curious to learn how this idea can be applied across diverse domains.
If you have data you're struggling to grok, and think such a utility could provide value,
ping me ([hi@andersource.dev](mailto:hi@andersource.dev)) - I might like to give it a shot!