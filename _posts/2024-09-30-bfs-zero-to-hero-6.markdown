---
layout: post
title:  "BFS zero-to-hero, part 6: Rush Hour"
date:   2024-09-30 00:19:00:00 +0300
categories:
image: "/assets/thumbnails/rushhour.webp"
themecolor: "#ffeebd"
hide_thumbnail: true
description: "Solving the famous traffic jam game with BFS"
---

{:refdef: style="text-align: center;"}
![Using BFS to solve Rush Hour](/assets/bfs-zero-to-hero/rushhour_bfs.gif){: width="300" :class="center"}
{: refdef}

[Part 1](/2023/09/30/bfs-zero-to-hero-1.html) |
[Part 2](/2023/10/15/bfs-zero-to-hero-2.html) |
[Parts 3 & 4](/2024/04/12/bfs-zero-to-hero-3-4.html) |
[Part 5](/2024/04/16/bfs-zero-to-hero-5.html)

### Challenge 6: [Rush Hour](https://en.wikipedia.org/wiki/Rush_Hour_(puzzle))
Rush Hour is a famous puzzle game where you slide vehicles to unjam a red car to freedom. It's a nice game - I spent hours with it as a kid!

In this challenge you'll apply BFS to solve Rush Hour puzzles. Some directions:
* You'll receive a list describing vehicle positions, with a color and a list of occupied cells for each vehicle
* The aim is for the red car to arrive at the red rectangle
* This time, you're controlling _multiple objects_ (vehicles in this case)
  * So you need to return a list of instructions, where each instruction refers to a specific vehicle (and contains the direction this vehicle needs to move towards)
* Another change from the previous challenge - now it's up to you to implement board simuations and validate board states

[Enjoy!](https://github.com/andersource/bfs-zero-to-hero/tree/main/6-rushhour)

### 5-year blogday
This blog recently celebrated 5 years! [Here's a post from exactly 5 years ago.](/2019/09/30/f-score-deep-dive.html)
Turbulent as some of those years were, I'm glad I stuck to writing.


