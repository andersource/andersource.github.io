---
layout: post
title:  "Using a mobile device as a rotation controller"
date:   2019-09-17 12:00:00 +0300
categories:
description: "Use your device's orientation sensors to rotate the Earth"
image: "/assets/thumbnails/rotation_controller_earth.webp"
themecolor: "#c2e6ff"
---

## Demo
Use a QR code scanner with a mobile device to scan this code, and start moving the Earth!

{% include device-rotation-controller/globe.html %}

## Putting it together
This actually was a classic case of stacking existing components like lego.
* The [DeviceOrientation](https://www.w3.org/TR/orientation-event/) event is part of the W3C standards, and while it's still an experimental feature, many browsers already support it.
The documentation even helps you out converting Euler angles (the event's representation of the device orientation) to quaternions, which are generally useful when dealing with rotations and orientations.
* [three.js](https://threejs.org) is a powerful 3D javascript library; the globe was adapted from [this example](https://threejs.org/examples/software_geometry_earth.html).
* [PeerJS](https://peerjs.com) is a javascript p2p library wrapping WebRTC with a very easy-to-use API, and they even provide a default, free broker server for the initial connection.
* I used [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator#readme) to generate the QR code.

### Code
The code is available on Github:
[globe.html](https://github.com/andersource/andersource.github.io/blob/master/_includes/device-rotation-controller/globe.html),
[globe.js](https://github.com/andersource/andersource.github.io/blob/master/assets/device-rotation-controller/globe.js),
[client.html](https://github.com/andersource/andersource.github.io/blob/master/static/rotation-controller-client.html),
[client.js](https://github.com/andersource/andersource.github.io/blob/master/assets/device-rotation-controller/client.js).
