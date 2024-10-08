---
layout: post
title:  "BFS zero-to-hero, part 7: Crosstab"
date:   2024-10-08 00:09:00:00 +0300
categories:
image: "/assets/thumbnails/bfs_crosstab.webp"
themecolor: "#E0F0FF"
description: "Implementing the logic of a tiny crosstab statistics engine"
hide_thumbnail: "true"
---

{:refdef: style="text-align: center;"}
![Using BFS to create Crosstab queries](/assets/thumbnails/bfs_crosstab.webp){: width="600" :class="center"}
{: refdef}

[Part 1](/2023/09/30/bfs-zero-to-hero-1.html) |
[Part 2](/2023/10/15/bfs-zero-to-hero-2.html) |
[Parts 3 & 4](/2024/04/12/bfs-zero-to-hero-3-4.html) |
[Part 5](/2024/04/16/bfs-zero-to-hero-5.html) |
[Part 6](/2024/09/30/bfs-zero-to-hero-6.html)

### Challenge 7: Crosstabs everywhere
This is the final installment of the BFS zero-to-hero series, hope you enjoyed it! (And learned a bit, too.)

It's based on an exercise I was given a very long time ago, which really opened my mind to the power of abstractions.

In a nutshell: you're going to implement a flexible engine for generating SQL queries to get data for crosstab statistics.

_Say what?_ OK, let's break that down...

#### What's a crosstab, anyway?
Imagine you're a software engineer at InspireNote Inc.; among other things, you're intimately familiar with the following tables in the database:

`Customer`:

| CustomerID | Name         |
|-----------|--------------|
| 5312      | J. S. Bach   |
| 5313      | Edvard Grieg |

`Product`:


| ProductID | Name           |
|-----------|----------------|
| 479       | Norwegian landscape vibes |
| 480       | Polyphony4Ever |


`Orders`:


| OrderID | DateTime   | CustomerID | ProductID | Amount |
|---------|------------|------------|-----------|--------|
| 101     | 1685-03-21 | 5312       | 480       | 12     |
| 102     | 1874-08-31 | 5313       | 479       | 1      |
| 157     | 1704-11-14 | 5312       | 480       | 48     |


One day your manager, wanting to better understand the company's customers, asks you to create the following view:

| ↓ Customer / Product → | Norwegian landscape vibes | Polyphony4Ever|
|-----------------------|---------------------------|----------------|
| J. S. Bach            | 0                         | 1,128          |
| Edvard Grieg          | 140                       | 0              |

"No worries", you utter, and already the necessary SQL springs to your mind:

```sql
SELECT      Customer.Name, Product.Name, SUM(Orders.Amount)
FROM        Customer
            JOIN Orders ON Customer.CustomerID = Orders.CustomerID
            JOIN Product ON Product.ProductID = Orders.ProductID
GROUP BY    Customer.Name, Product.Name
```

A pivot quickly follows, sprinkle some UI, deploy, and wham! Your manager has her [crosstab](https://en.wikipedia.org/wiki/Contingency_table).

The view is well-received -- so much, in fact, that a week later your manager clears all your JIRA tickets, hangs an ERD poster of the company's sprawling database next to your desk, and hands you the specs of 73 crosstab requests from various execs in the organization.  

Other engineers would have been overwhelmed, perhaps. Not you; you won't let a bit of work get in the way of being lazy.

#### The challenge
You need to write a function that, given a crosstab view specification (and with knowledge of the database schema), generates an SQL for querying the data to construct the requested crosstab.

To do that, we observe that such queries have a common structure:
* The `SELECT` clause contains the two category columns, and some aggregation of the value column
* The `FROM` clause contains a chain of `JOIN`s linking the two tables containing the category columns
* `GROUP BY` the two category columns

The `JOIN` chain is where you'll need BFS and the database schema.

#### The Chinook database
The challenge uses the [Chinook toy database](https://github.com/lerocha/chinook-database?tab=readme-ov-file).
Download the sqlite3 version and place it in the same directory as the challenge's code. Here's a reference ERD from the homepage:

{:refdef: style="text-align: center;"}
![Chinook database ERD](/assets/bfs-zero-to-hero/chinook_erd.webp){: width="600" :class="center"}
{: refdef}


[Go ahead and try the challenge](https://github.com/andersource/bfs-zero-to-hero/tree/main/7-crosstab). Good luck!