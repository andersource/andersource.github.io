---
layout: post
title:  "Spraying Digital Graffiti"
date:   2024-05-30 15:00:00 +0300
categories:
image_style: "cover"
image: "/assets/thumbnails/spraying_digital_graffiti.webp"
---

## Background
My partner has an upcoming show she's promoting. She has a couple of nice pictures with colored walls, and I thought it could be cool to spray "digital graffiti" on the walls with info about the show.
My options were:
* Plaster semi-transparent text on the wall, which would look cheap and lousy
* Fiddle with some gen AI, but where's the sport in that
* Spend half a day to figure out how to do that computationally

Since we're here, we all know which option I chose!

## Let's get rolling
Say we have this nice picture of a textured wall ([Image by kues1 on Freepik](https://www.freepik.com/free-photo/cement-texture_1034632.htm)):

![Textured cement wall](/assets/spraying-digital-graffiti/cement-texture.jpg)

First, using [image color replacement](https://andersource.dev/2021/06/12/image-color-replacement.html) from a while back, we
can paint the wall pink, which already looks neat:
![Textured cement wall painted pink](/assets/spraying-digital-graffiti/cement-texture-pink.jpg)

Now, suppose we also have a binary mask depicting the graffiti we'd like to spray:
![Binary mask with circle in the center](/assets/spraying-digital-graffiti/circle_mask.png)

We can use the mask to mix between the two wall images (original and painted):
![Textured cement wall with pink circle](/assets/spraying-digital-graffiti/circle_graffiti_1.png)

That looks pretty nice, but the mask boundary is too smooth and detached from the texture. Real paint would behave slightly differently
based on the bumps in the cement. How do we modify the boundary?

### Pathfinding to the rescue
We want to modify the mask's contour, such that it follows the original contour pretty closely, but also tries to avoid crossing "high-energy" areas of the image.
We can use [edge detection](https://en.wikipedia.org/wiki/Edge_detection) to define these high-energy areas.

#### Defining the path
To define the path, we sample the contour uniformly, but then wiggle the indices a bit to start from low-energy areas of the image.

![Edge map with contour and sampled points](/assets/spraying-digital-graffiti/contour_sampling.png)

Next we stitch the new contour as a series of paths using skimage's [`graph.route_through_array`](https://scikit-image.org/docs/stable/api/skimage.graph.html#skimage.graph.route_through_array),
which finds the minimum-cost-path through a cost landscape. To define the cost landscape, we compose the edge map with the [distsance transform](https://en.wikipedia.org/wiki/Distance_transform) of the original contour.
We can vary the weighing between the distance transform and the edge map to balance how strictly we want the new contour to adhere to the original one.

Here's an example cost landscape:

![Cost map](/assets/spraying-digital-graffiti/cost.png)

Here's the minimal cost path in this case:

![Cost map with minimum cost path](/assets/spraying-digital-graffiti/cost_path.png)

Finally, after we obtain the new contour, we can use it to define a new mask and mix the images:

![Textured cement wall with pink circle](/assets/spraying-digital-graffiti/circle_graffiti_2.png)

The effect is subtle but, in my opinion, makes the result a lot more realistic.

## Gimme the code
* Image color replacement is [here](https://github.com/andersource/image-color-replacement)
* Rest of the process described is [here](https://gist.github.com/andersource/8e2ffa2382fca01f176420f54332ba22). This code is specifically tailored to what I wanted, but it shouldn't be hard to make it more general

![Textured wall with text graffiti](/assets/spraying-digital-graffiti/tfs_show.png)