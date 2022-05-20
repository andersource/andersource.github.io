function connect(remote_id) {
  var peer = new Peer();
  peer.on('open', function(id) {
    var conn = peer.connect(remote_id);
    conn.on('open', function() {
      conn.on('data', function(data) {
        console.log('Received: ', data);
      });

      var t1 = new Date();

      if (typeof( DeviceOrientationEvent ) !== "undefined"
          && typeof( DeviceOrientationEvent.requestPermission ) === "function") {
        DeviceOrientationEvent.requestPermission().then(response => {
            if (response == 'granted') {
                var t1 = new Date();
                window.addEventListener('deviceorientation', function(event) {
                    var t2 = new Date();
                    conn.send(JSON.stringify({
                        alpha: event.alpha,
                        beta: event.beta,
                        gamma: event.gamma,
                        dt_ms: t2 - t1
                    }));
                }, true);
            }
        });
      } else {
        window.addEventListener('deviceorientation', function(event) {
        var t2 = new Date();
          conn.send(JSON.stringify({alpha: event.alpha, beta: event.beta, gamma: event.gamma, dt_ms: t2 - t1}));
        }, true);
      }
    });
  });
}

window.onload = function() {
  connect(window.location.hash.replace('#hid=', ''));
}
