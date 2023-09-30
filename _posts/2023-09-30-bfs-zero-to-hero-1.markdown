---
layout: post
title:  "BFS zero-to-hero, part 1: intro & maze"
date:   2023-09-30 16:00:00 +0300
categories:
themecolor: "#fffae0"
image: "/assets/thumbnails/maze.webp"
image_style: "cover"
hide_thumbnail: true
description: "Starting a series of challenges on the application of the BFS algorithm"
---

{:refdef: style="text-align: center;"}
![Using BFS to solve a maze](/assets/bfs-zero-to-hero/maze_bfs.gif){: width="300" :class="center"}
{: refdef}

## Intro
In the last year or so I've been working with a program providing tech-ed
to Israeli youth in disadvantaged areas. We're doing a lot of fun learning activities and challenges,
and there was one idea that had me particularly excited. Unfortunately it didn't make it into the
curriculum, but I was so hyped about it I decided to do it anyway and post it here. The idea is
to create a series of BFS ([breadth-first search](https://en.wikipedia.org/wiki/Breadth-first_search)) application challenges, where:
* The challenges get progressively more abstract, allowing the students to both gain a deep understanding of how the algorithm works, and learn how to identify problems where a seemingly unrelated algorithm can be applied. 
* Solutions are animated using pygame, allowing students to visually see the result of their implementation and experience the satisfaction of solving the problem.

The abstraction progression happens by starting with problems where the state space strongly corresponds to a physical space (like a 2D maze)
and gradually moving to problems where the state space is more abstract. 

This seems like a fun thing to make, so here's my go at it!

## Challenge 1: solving a maze
The first challenge is straightforward - solving a maze, i.e. getting from a starting point to an end point on a 2D cell grid,
moving only between adjacent cells, where some cells are blocked ("walls").
The graph nodes are all the (non-wall) maze cells, and edges exist between any two adjacent cells.

### Getting started
To try your hand at this challenge, clone [this repo](https://github.com/andersource/bfs-zero-to-hero),
install `requirements.txt`, and open `1-maze/main.py`. The code has implementation instructions for the pathfinding function.

Good luck, and enjoy!


