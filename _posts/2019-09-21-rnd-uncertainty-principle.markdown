---
layout: post
title:  "Uncertainty Principle in software R&D"
date:   2019-09-21 13:00:00 +0300
categories:
---

[Heisenberg's Uncertainty Principle](https://en.wikipedia.org/wiki/Uncertainty_principle) is an important result in physics, expressing a limit regarding the measurement of certain pairs of particles' physical properties. In essence, it states that the uncertainty of any measurement of these pairs of properties at the same time has a lower bound. For example, if we're measuring a particle's position and velocity, and want to be more certain about the particle's _position_ (measure the position more precisely),
at some point we would inevitably start becoming less certain about the particle's _velocity_, regardless of the measurement tools we use. This limitation doesn't come from any technical
properties of how we measure those properties. Rather, it points to a loss of mathematical meaning as the measurements get "too precise".

I believe a similar phenomenon exists in the world of research and development. It seems trivial, but too many times I've seen it forgotten (or ignored) when it was inconvenient.

Pick a random project management book or article, and you'll probably see projects depicted as triangles representing the projects' constraints in some form. Two of the primary constraints
would be equivalents of _time_ and _result_: we know what we want, and we know when we want it. In practice we are usually not overly concerned with calculating confidence intervals
for those variables.

But the more _novel_ a project (or subtask) is, the more inherent uncertainty it has. This means that if we're trying to take on something that no-one in-house has experience with
(and we're not consulting someone with experience), the error bars on _both_ time and result should be quite large. And if we're tackling something entirely new (as far as we can tell
from preliminary research), it's almost meaningless to assign an expected value to both the project's duration and the result. This is important because after a certain threshold, a change of scope is warranted: as a manager, at some point you stop framing the project as "I want X by Y", and start framing it as one of either:
* "I want X and I don't care how long it takes."
* "I'm willing to give this project until Y, no matter the results."

Of course both of these framings are problematic from the business perspective. But the way I see it, assigning too-small error bars just to make a project's premise feasible
business-wise is a risky endeavor at best.

Note that even when a project is not very novel, [we are not great at making practical estimates](https://erikbern.com/2019/04/15/why-software-projects-take-longer-than-you-think-a-statistical-model.html). Even when we would expect uncertainty to be controlled it comes back to bite us - all the more reason to be extra-careful of underestimating it.
