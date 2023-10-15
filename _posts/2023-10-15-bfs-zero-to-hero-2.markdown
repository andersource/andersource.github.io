---
layout: post
title:  "BFS zero-to-hero, part 2: snake"
date:   2023-10-15 21:50:00 +0300
categories:
image: "/assets/thumbnails/bfs_snake.webp"
image_style: "cover"
hide_thumbnail: true
description: "Part 2 of the BFS challenge series: automatic Snake player"
---

{:refdef: style="text-align: center;"}
![Using BFS to solve a maze](/assets/bfs-zero-to-hero/snake_bfs.gif){: width="300" :class="center"}
{: refdef}

This is part 2 of the [BFS challenge series](/2023/09/30/bfs-zero-to-hero-1), in which you'll need to apply
BFS to progressively more abstract problems.

## Challenge 2: playing snake
In this challenge you're tasked with assisting a self-playing snake game in planning the snake's route.

### A familiar problem with a twist
This seems like a simple chaining of the previous part's solution - whenever the food is eaten,
plan a route from the snake's head to the new food position with the snake and game boundaries as walls.
However, this case is slightly different - as the snake moves, some walls become empty cells, and vice versa.
Can you think of an appropriate adaptation to the algorithm? Solution (**spoiler alert**):

<div class="spoiler">
<p>Fortunately we don't have to account for the newly-created walls, as there's no reason to return
to a previously-visited cell. This is fortunate because otherwise formulating the solution with BFS
would have been much more difficult or even infeasible.</p>
<p>Regarding the vacated walls, an elegant way to utilize them is to include in the search space state
the time that elapsed since planning the route. This way, for each state popped from the BFS queue,
we can use the elapsed-time value to "trim" the snake's tail and determine exactly which snake
cells constitute as walls and which don't.</p>
</div>

### Have a go!
To try your hand at this challenge, clone [the same repo from the previous part](https://github.com/andersource/bfs-zero-to-hero) (if you haven't yet),
install `requirements.txt`, and open `2-snake/main.py`. The code has implementation instructions for the pathfinding function.

Note the direction representation scheme and the solution structure (list of direction indices).

Good luck, and enjoy!

[#StandWithUs](https://www.instagram.com/standwithus/)


