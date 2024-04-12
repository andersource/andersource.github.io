---
layout: post
title:  "BFS zero-to-hero, parts 3 & 4"
date:   2024-04-12 10:30:00 +0300
categories:
image: "/assets/thumbnails/fort_escape.webp"
themecolor: "#f6efff"
image_style: "cover"
description: "Water jugs and fort escapes"
---


[Part 1](/2023/09/30/bfs-zero-to-hero-1.html) |
[Part 2](/2023/10/15/bfs-zero-to-hero-2.html)

It's been a while! The crazy war situation in Israel knocked me off track, but here we are.

### Challenge 3: water jugs
In this challenge you need to write a general solution to the [water pouring problem](https://en.wikipedia.org/wiki/Water_pouring_puzzle#:~:text=Puzzles%20of%20this%20type%20ask,in%20some%20jug%20or%20jugs.): given the maximum capacity of
two water jugs and a goal amount, concoct a plan to fill / empty / pour the jugs to achieve the desired amount
(assuming a large source of water is available). The catch: there's no way to measure
water amounts in the jugs other than completely empty / full. Although this problem can be solved with more specialized math,
it's also efficiently solvable using BFS.


### Challenge 4: escape from the fort
Olivia, Amelia and Lucas have been imprisoned in a fort by a dragon. They have access to a pulley
with large baskets at the ends that could allow them to escape. Alas, the pulley has been magicked by
the dragon to be lowerable only when the weight difference between the upper end
and the lower end is _exactly_ 25 kg.

Amelia weighs 50 kg, Olivia weighs 75 kg, and Lucas weighs 125 kg.
Aditionally, they've found a 25 kg weight to aid them.

Your challenge is to implement a search that finds the quickest way to escape the fort.


### Try it out
Clone [the repo](https://github.com/andersource/bfs-zero-to-hero) and hack away!
Pay attention to all the implementation instructions.

[This post from a while back](/2020/10/13/water-jugs-BFS.html) might be helpful too. Enjoy :)

