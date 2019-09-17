var i_alpha;
var globe, renderer;
var degtorad = Math.PI / 180;
var viewDist = 3.5;

function prepare3d() {
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  renderer = new THREE.WebGLRenderer({alpha: true});
  var canvasHeight = window.innerHeight * .4;
  var canvasWidth = window.innerWidth * .4;
  renderer.setSize(canvasWidth, canvasHeight);
  if (canvasWidth <= 600) {
    viewDist = 5;
  }

  var geometry = new THREE.SphereGeometry(2, 32, 32);
  var material = new THREE.MeshBasicMaterial({color: 0x00ff00});
  globe = new THREE.Mesh(geometry, material);
  scene.add(globe);

  var loader = new THREE.TextureLoader();
  loader.load('/assets/device-rotation-controller/earth_texture.jpg', function(texture) {
    globe.material.map = texture;
    globe.material.color = undefined;
    globe.material.needsUpdate = true;
  });

  var light = new THREE.PointLight(0xffffff, 1, 100);
  light.position.set(3, 3, 3);
  scene.add(light);

  camera.position.z = viewDist;
  camera.up.set(0, 1, 0);
  camera.lookAt(0, 0, 0);


  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  animate();
}

function makeQR(data) {
  var typeNumber = 0;
  var errorCorrectionLevel = 'L';
  var qr = qrcode(typeNumber, errorCorrectionLevel);
  qr.addData(data);
  qr.make();
  document.getElementById('qrcode').innerHTML = qr.createImgTag(7);
}

function euler2quaternion(alpha, beta, gamma) {
  var _x = beta  ? beta  * degtorad : 0; // beta value
  var _y = gamma ? gamma * degtorad : 0; // gamma value
  var _z = alpha ? alpha * degtorad : 0; // alpha value

  var cX = Math.cos( _x/2 );
  var cY = Math.cos( _y/2 );
  var cZ = Math.cos( _z/2 );
  var sX = Math.sin( _x/2 );
  var sY = Math.sin( _y/2 );
  var sZ = Math.sin( _z/2 );

  var w = cX * cY * cZ - sX * sY * sZ;
  var x = sX * cY * cZ - cX * sY * sZ;
  var y = cX * sY * cZ + sX * cY * sZ;
  var z = cX * cY * sZ + sX * sY * cZ;

  return new THREE.Quaternion(x, y, z, w);
}

window.onload = function() {
  prepare3d();
  var peer = new Peer();
  peer.on('open', function(id) {
    makeQR('https://andersource.dev/rotation-controller-client.html#hid=' + id);
    peer.on('connection', function(conn) {
      var qrelem = document.getElementById('qrcode');
      qrelem.parentNode.removeChild(qrelem);
      document.getElementById("demo_body").appendChild(renderer.domElement);
      conn.on('data', function(data) {
        try {
          data = JSON.parse(data);

          if (i_alpha == undefined) {
            i_alpha = data.alpha;
          }

          data.alpha = (data.alpha - i_alpha) % 360;

          globe.setRotationFromQuaternion(euler2quaternion(data.alpha, data.beta, data.gamma));
        } catch(error) { }
      });
    });
  });
}
