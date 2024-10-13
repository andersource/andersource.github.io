---
layout: post
title:  "Silly programs from almost 15 years ago"
date:   2024-10-13 08:30:00:00 +0300
categories:
image: "/assets/thumbnails/silly_programs.webp"
image_style: "cover"
description: "Abusing WinForms' TransparencyKey and TopMost properties"
---

While I've been doing machine learning / data science for the last 7 years,
and primarily working with python and web apps for longer, the beginning
of my career saw me developing client-server applications with [Windows Forms](https://en.wikipedia.org/wiki/Windows_Forms)
and [IIS](https://en.wikipedia.org/wiki/Internet_Information_Services).

About 15 years ago I was just starting my professional coding career. I was junior, eager to learn, and had a lot of time and energy to tinker around.

At some point I stumbled upon [TransparencyKey](https://learn.microsoft.com/en-us/dotnet/api/system.windows.forms.form.transparencykey?view=windowsdesktop-8.0) and [TopMost](https://learn.microsoft.com/en-us/dotnet/api/system.windows.forms.form.topmost?view=windowsdesktop-8.0), 
a pair of properties that allowed you to develop widget-style apps that always stayed on top
but could be mostly transparent (to the mouse as well as the eye.) Combined with some Win32 API functionality, this could be used to do some really cool stuff. For about 2 years, 90% of my side projects would involve those properties. (Fixated? Me? No way)

I envisioned a whole suite of whimsical toys to liven up our dreary corporate workstations. Being junior, time after time I fell to the classic side project pitfall: I'd
get excited by some idea, get to a working proof of concept, and move on to the next idea thinking I'd come back later to finish it up. Which, you guessed it, never happened.

Until now! I got nostalgic and thought I'd at least dig up what projects I could find and write about them.

I have to say, I was positively surprised by how smooth it was to get 15-year-old code running. These projects were developed
on Windows XP / Windows 7 using .NET 4 or earlier, and apart from some graphics glitches (probably stemming from me doing stuff inefficiently) they work without modification
on Windows 11 after upgrading to .NET 8. Kudos for the backward compatibility, Microsoft.

And now, without further ado:

## Boo
Always just a hotkey-press away from being visited by a creepy (but cute) purple creature. In newer versions of Windows
the shadow that windows cast are part of the window size, which is not accounted for in the code (hence the small gaps.)

<video src="/assets/silly-programs/boo.mp4" controls="controls" style="width: 100%;"></video><br/>


## Spinner
Press a hotkey to send the active window cartwheeling. The glitches are due to the screen recording (it works smoothly otherwise, if slow on large windows.)

<video src="/assets/silly-programs/spinner.mp4" controls="controls" style="width: 100%;"></video><br/>

## My explorer
Why have all your files sit quietly in their folders if they could be floating around? My ambitious intent was to expand by animating all the contents of a folder flying from it when clicked, but I didn't quite get there. 

<video src="/assets/silly-programs/myexplorer.mp4" controls="controls" style="width: 100%;"></video><br/>

## PacMonster
I was very proud of this one, which is basically low-key malware for trolling my colleagues.
We had a power-user culture and used lots of shortcuts; sometimes when a colleague left their workstation I'd replace one of their
shortcuts to point to this. It'd open notepad, blurt some insult, and spawn a pacman that would chase the mouse around. When the pacman was
on the mouse you couldn't click anything (because the pacman captured the mouse press event.)

When you tried to open task manager, it closed the process but rendered a "fake" task manager (which looks very out-of-place on Windows 11), only to close it dramatically a few seconds later (this part sometimes crashes on Windows 11).

When you tried to open the commandline shell, it closed it and was angry (jittering around.)

If you wanted to close it, you had to create a "C:\Users\public\Downloads\pwned.txt", though some colleagues ended up restarting to get rid of it (I know, this wouldn't fly today, but wasn't so out-of-place at the time at that org.)

<video src="/assets/silly-programs/pacmonster.mp4" controls="controls" style="width: 100%;"></video><br/>

## Other projects
Sadly I lost the source to a couple of other projects, which I actually wrote later and were more mature.

### Flood-fill animator
Used [flood-fill](https://en.wikipedia.org/wiki/Flood_fill) to materialize stuff on the screen (usually images with mostly transparent background or text.) Sounds a bit basic, but I think the overall effect was neat.

### Smiley integrator
Written when mobile IM apps started to proliferate, everybody was using way too many emojis, and I wanted to easily include them in emails and documents (I know.)

On hotkey press, a 3x3 roster of emojis appeared, with left / right arrows switching between sets. You used the numpad to pick an emoji, it was copied to the clipboard and then the app would emit a "ctrl+v" so the emoji was pasted as an image to whatever you were focused on.

It actually worked quite well, quickly became intuitive to use, and was adopted by quite a lot of people in the org. I ended up adding all sorts of features such as custom emoji image paths and controlling the pasted emoji size.

## The Code
If for some reason you'd like to browse the code, you can find it [here](https://github.com/andersource/silly-programs-15-years).


