---
layout: post
title:  "Codyssey @ Pycon IL 2024"
date:   2024-10-09 13:25:00:00 +0300
categories:
image: "/assets/thumbnails/codyssey.webp"
image_style: "cover"
description: "Running a playful competition at PyCon Israel workshops section"
carousels:
  - images: 
    - image: /assets/codyssey/pycon1.jpg
    - image: /assets/codyssey/pycon2.jpg
    - image: /assets/codyssey/pycon3.jpg
    - image: /assets/codyssey/pycon4.jpg
    - image: /assets/codyssey/pycon5.jpg
    - image: /assets/codyssey/pycon6.jpg
    - image: /assets/codyssey/pycon7.jpg
    - image: /assets/codyssey/pycon8.jpg
    - image: /assets/codyssey/pycon9.jpg
    - image: /assets/codyssey/pycon10.jpg
---

Over the last few months I spent a lot of time creating [Codyssey](https://codyssey.andersource.dev/),
a playful coding competition format where players write code that controls agents in simple games:

<video src="/assets/codyssey/coding_catcher.mov" controls="controls" style="width: 100%;"></video>

The inspiration came from two places:
* Practicing reinforcement learning with Gym (now [Gymnasium](https://gymnasium.farama.org/)), I had fun trying to design "hard-coded" strategies for the various games before training an agent to learn a strategy
* [Control systems](https://en.wikipedia.org/wiki/Control_system), when implemented in code, have a slightly atypical programming model where you write code that runs dozens (or more) times a second and makes micro-decisions, which I found interesting to explore

Each game has its own environment and challenges, and a specific end-goal. Participants compete to solve as many games as they can within the time limits of the competition.

I got a session for the competition at the recent PyCon IL, and it went really well! There were developers from diverse backgrounds,
from fresh bootcamp graduates to experienced developers at tech companies.

You can watch the trailer and try the demo [here](https://codyssey.andersource.dev/).

If you're interested in inviting me to run Codyssey at your place - feel free to [reach out](mailto:daniel@andersource.dev)! 

 {% include carousel.html height="50" unit="%" duration="3" number="1" %}