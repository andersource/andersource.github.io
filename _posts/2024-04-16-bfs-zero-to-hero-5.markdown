---
layout: post
title:  "BFS zero-to-hero, part 5: the 15-puzzle"
date:   2024-04-16 00:12:00 +0300
categories:
image: "/assets/thumbnails/bfs_15_puzzle.webp"
themecolor: "#bdb397"
hide_thumbnail: true
description: "Solving a famous puzzle with BFS"
---

{:refdef: style="text-align: center;"}
![Using BFS to solve the 15-puzzle](/assets/bfs-zero-to-hero/fifteen_puzzle_bfs.gif){: width="300" :class="center"}
{: refdef}

[Part 1](/2023/09/30/bfs-zero-to-hero-1.html) |
[Part 2](/2023/10/15/bfs-zero-to-hero-2.html) |
[Parts 3 & 4](/2024/04/12/bfs-zero-to-hero-3-4.html)

### Challenge 5: the [15-puzzle](https://en.wikipedia.org/wiki/15_Puzzle)
The 15-puzzle is a famous sliding puzzle. Your aim is to slide the numbered
squares around, using a single empty square, to finally achieve an orderly board.

The puzzle is amenable to BFS, although the search space gets big quickly
so bigger boards can require minutes (or more!) to solve.

I think an elegant way to represent a solution is to trace the imaginary path of the empty
square, which can have repeat positions. However, in this puzzle's case, the state
represents the _entire_ board's configuration.


### Give it a shot
Clone [the repo](https://github.com/andersource/bfs-zero-to-hero) and crack it. The last test case might take several seconds to compute (but shouldn't take _too_ long.)

