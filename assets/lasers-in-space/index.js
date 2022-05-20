var degtorad = Math.PI / 180;
var i_alpha = {};


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


function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function jq_extend(a, b){
    for(var key in b)
        if(b.hasOwnProperty(key))
            a[key] = b[key];
    return a;
}


function setLightMeter(value) {
    var meter = document.getElementById('light-meter');
    var height = value * 13.5;
    var top = 20.5 - height;
    meter.setAttribute('style', 'top: ' + top + '%; height: ' + height + '%;');
}

function makeLightSetter(value) {
    return function() {
        setLightMeter(value);
    }
}

function animateLightMeter(from_value, to_value) {
    var N = 50;
    for (var i = 0; i < N + 1; i++) {
        setTimeout(makeLightSetter(from_value + (to_value - from_value) / N * i), 5 * i);
    }
}


function LaserBeam(iconfig) {

    var config = {
        length: 500,
        reflectMax: 5,
        color: 0x4444aa,
        idx: -1
    };
    config = jq_extend(config, iconfig);

    this.idx = config.idx;
    this.object3d = new THREE.Object3D();
    this.reflectObject = null;
    this.pointLight = new THREE.PointLight(0xffffff, 1, 4);
    var raycaster = new THREE.Raycaster();
    var canvas = generateLaserBodyCanvas();
    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    var material = new THREE.MeshBasicMaterial({
        map: texture,
        blending: THREE.AdditiveBlending,
        color: config.color,
        side: THREE.DoubleSide,
        depthWrite: false,
        transparent: true
    });
    var geometry = new THREE.PlaneGeometry(1, 0.1 * 5);
    geometry.rotateY(0.5 * Math.PI);

    //use planes to simulate laserbeam
    var i, nPlanes = 15;
    for (i = 0; i < nPlanes; i++) {
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = 1 / 2;
        mesh.rotation.z = i / nPlanes * Math.PI;
        this.object3d.add(mesh);
    }

    if (config.reflectMax > 0)
        this.reflectObject = new LaserBeam(jq_extend(config, {
            reflectMax: config.reflectMax - 1,
            idx: this.idx
        }));

    this.intersect = function(direction, objectArray = [], laser_flags={},
                              win_callback=function() {}) {
        raycaster.set(
            this.object3d.position.clone(),
            direction.clone().normalize()
        );

        var intersectArray = [];
        intersectArray = raycaster.intersectObjects(objectArray, false);

        if (intersectArray.length > 0) {
            this.object3d.scale.z = intersectArray[0].distance;
            this.object3d.lookAt(intersectArray[0].point.clone());
            this.pointLight.visible = true;

            if ('is_target' in intersectArray[0].object && intersectArray[0].object.is_target) {
                if (!laser_flags[this.idx]) {
                    var n_lasers = Object.values(laser_flags).length;
                    var n_on_lasers = Object.values(laser_flags).filter(x => x).length;
                    animateLightMeter(n_on_lasers / n_lasers, (n_on_lasers + 1) / n_lasers);
                    laser_flags[this.idx] = true;
                    if (n_on_lasers + 1 == n_lasers) {
                        win_callback();
                    }
                }
            }

            if ('laserkiller' in intersectArray[0].object && intersectArray[0].object.laserkiller) {
                if (laser_flags[this.idx]) {
                    var n_lasers = Object.values(laser_flags).length;
                    var n_on_lasers = Object.values(laser_flags).filter(x => x).length;
                    animateLightMeter(n_on_lasers / n_lasers, (n_on_lasers - 1) / n_lasers);
                    laser_flags[this.idx] = false;
                }
            }

            if (!('reflective' in intersectArray[0].object && intersectArray[0].object.reflective)) {
                this.hiddenReflectObject();
                return;
            }

            //get normal vector
            var normalMatrix = new THREE.Matrix3().getNormalMatrix(intersectArray[0].object.matrixWorld);
            var normalVector = intersectArray[0].face.normal.clone().applyMatrix3(normalMatrix).normalize();

            //set pointLight under plane
            this.pointLight.position.x = intersectArray[0].point.x + normalVector.x * 0.5;
            this.pointLight.position.y = intersectArray[0].point.y + normalVector.y * 0.5;
            this.pointLight.position.z = intersectArray[0].point.z + normalVector.z * 0.5;

            //calculation reflect vector
            var reflectVector = new THREE.Vector3(
                intersectArray[0].point.x - this.object3d.position.x,
                intersectArray[0].point.y - this.object3d.position.y,
                intersectArray[0].point.z - this.object3d.position.z
            ).normalize().reflect(normalVector);

            //set reflectObject
            if (this.reflectObject != null) {
                this.reflectObject.object3d.visible = true;
                this.reflectObject.object3d.position.set(
                    intersectArray[0].point.x,
                    intersectArray[0].point.y,
                    intersectArray[0].point.z
                );

                //iteration reflect
                this.reflectObject.intersect(reflectVector.clone(), objectArray, laser_flags, win_callback);
            }
        }
        //non collision
        else {
            this.object3d.scale.z = config.length;
            this.pointLight.visible = false;
            this.object3d.lookAt(
                this.object3d.position.x + direction.x,
                this.object3d.position.y + direction.y,
                this.object3d.position.z + direction.z
            );

            this.hiddenReflectObject();

            if (laser_flags[this.idx]) {
                var n_lasers = Object.values(laser_flags).length;
                var n_on_lasers = Object.values(laser_flags).filter(x => x).length;
                animateLightMeter(n_on_lasers / n_lasers, (n_on_lasers - 1) / n_lasers);
                laser_flags[this.idx] = false;
            }
        }
    }

    this.hiddenReflectObject = function() {
        if (this.reflectObject != null) {
            this.reflectObject.object3d.visible = false;
            this.reflectObject.pointLight.visible = false;
            this.reflectObject.hiddenReflectObject();
        }
    }

    return;

    function generateLaserBodyCanvas() {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.width = 1;
        canvas.height = 64;
        // set gradient
        var gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, 'rgba(  0,  0,  0,0.1)');
        gradient.addColorStop(0.1, 'rgba(160,160,160,0.3)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(0.9, 'rgba(160,160,160,0.3)');
        gradient.addColorStop(1.0, 'rgba(  0,  0,  0,0.1)');
        // fill the rectangle
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        // return the just built canvas
        return canvas;
    }

}


function addLaserToScene(laser, scene) {
    scene.add(laser.object3d);
    scene.add(laser.pointLight);

    if (laser.reflectObject != null) {
        addLaserToScene(laser.reflectObject, scene);
    }
}


function addTarget(scene) {
    const geometry = new THREE.SphereGeometry();
    const moon_texture = new THREE.TextureLoader().load('moon.jpeg');
    const material = new THREE.MeshPhongMaterial({map: moon_texture});
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -4;
    mesh.geometry.scale(.75, .75, .75);
    mesh.rotation.x = 2;
    scene.add(mesh);
    mesh.is_target = true;
    return mesh;
}


function setUpLevel1(scene, lasers, mirrors, mirror_locations, laser_flags) {
    var laserbeam1 = new LaserBeam({color: 0xff5555, idx: 0});
    laserbeam1.object3d.position.set(-1, 10, -2);
    addLaserToScene(laserbeam1, scene);
    lasers.push({obj: laserbeam1});

    var laserbeam2 = new LaserBeam({color: 0x55ff55, idx: 1});
    laserbeam2.object3d.position.set(-1, 10, -2);
    addLaserToScene(laserbeam2, scene);
    lasers.push({obj: laserbeam2});

    var laserbeam3 = new LaserBeam({color: 0x5555ff, idx: 2});
    laserbeam3.object3d.position.set(-1, 10, -2);
    addLaserToScene(laserbeam3, scene);
    lasers.push({obj: laserbeam3});

    var laserbeam4 = new LaserBeam({color: 0xaa55aa, idx: 3});
    laserbeam4.object3d.position.set(-1, 10, -2);
    addLaserToScene(laserbeam4, scene);
    lasers.push({obj: laserbeam4});

    mirror_locations.splice(0);
    mirror_locations.push(...[
        new THREE.Vector3(-7, 0, -6),
        new THREE.Vector3(-3.5, 3, -10),
        new THREE.Vector3(10, 2, -8.5),
        new THREE.Vector3(4.5, -1.5, -4),
    ]);

    for (var i = 0; i < lasers.length; i++) {
        lasers[i].direction = mirror_locations[i].clone().sub(lasers[i].obj.object3d.position);
    }

    for (var i = 0; i < lasers.length; i++) {
        laser_flags[lasers[i].obj.idx] = false;
    }
}

function setUpLevel2(scene, lasers, mirrors, mirror_locations, laser_flags, obstacles) {
    var wall1 = makeWall(
        new THREE.Vector3(-2.1, 1.8, -7.6),
        new THREE.Vector3(.5, .2, 0)
    );

    var wall2 = makeWall(
        new THREE.Vector3(2.7, -.9, -4),
        new THREE.Vector3(.5, .65, 0)
    );

    scene.add(wall1);

    scene.add(wall2);

    obstacles.splice(0);
    obstacles.push(wall1, wall2);

    var laserbeam1 = new LaserBeam({color: 0x55ff55, idx: 1});
    laserbeam1.object3d.position.set(-1, 10, -2);
    addLaserToScene(laserbeam1, scene);
    lasers.push({obj: laserbeam1, direction: new THREE.Vector3(-2.5, -7, -8)});

    var laserbeam2 = new LaserBeam({color: 0xaa55aa, idx: 3});
    laserbeam2.object3d.position.set(-1, 10, -2);
    addLaserToScene(laserbeam2, scene);
    lasers.push({obj: laserbeam2, direction: new THREE.Vector3(5.5, -11.5, -2)});

    clearObject(laser_flags);
    for (var i = 0; i < lasers.length; i++) {
        laser_flags[lasers[i].obj.idx] = false;
    }
}


function setUpLevel3(scene, lasers, mirrors, mirror_locations, laser_flags, obstacles) {
    var wall1 = makeWall(
        new THREE.Vector3(-2.1, 1.8, -7.6),
        new THREE.Vector3(.5, .2, 0)
    );

    var wall2 = makeWall(
        new THREE.Vector3(6, 1.2, -6.7),
        new THREE.Vector3(.2, 1.3, 0)
    );

    var wall3 = makeWall(
        new THREE.Vector3(-4.2, 0, -5.2),
        new THREE.Vector3(0, 2.1, 0)
    );

    var wall4 = makeWall(
        new THREE.Vector3(-2.4, -0.6, -5.2),
        new THREE.Vector3(0, 1.2, 0)
    );

    scene.add(wall1);
    scene.add(wall2);
    scene.add(wall3);
    scene.add(wall4);

    obstacles.push(wall1, wall2, wall3, wall4);

    var laserbeam1 = new LaserBeam({color: 0xff5555, idx: 0});
    laserbeam1.object3d.position.set(-1, 10, -2);
    addLaserToScene(laserbeam1, scene);
    lasers.push({obj: laserbeam1, direction: new THREE.Vector3(-6, -10, -4)});

    clearObject(laser_flags);
    for (var i = 0; i < lasers.length; i++) {
        laser_flags[lasers[i].obj.idx] = false;
    }
}


function makeWall(position, orientation) {
    var geometry = new THREE.PlaneGeometry(1, 1, 10, 10);
    var wall_texture = new THREE.TextureLoader().load('brick.png')
    var material = new THREE.MeshLambertMaterial({map: wall_texture, side: THREE.DoubleSide});
    const res = new THREE.Mesh(geometry, material);
    res.position.x = position.x;
    res.position.y = position.y;
    res.position.z = position.z;

    res.rotation.x = orientation.x;
    res.rotation.y = orientation.y;
    res.rotation.z = orientation.z;

    res.laserkiller = true;

    return res
}


function removeFromScene(scene, laser) {
    scene.remove(laser.object3d);
    scene.remove(laser.pointLight);

    if (laser.reflectObject != null) {
        removeFromScene(scene, laser.reflectObject);
    }
}

function clearObject(myObject) {
    for (var member in myObject) delete myObject[member];
}


function makeQR(data) {
    var typeNumber = 0;
    var errorCorrectionLevel = 'L';
    var qr = qrcode(typeNumber, errorCorrectionLevel);
    qr.addData(data);
    qr.make();
    document.getElementById('qr-code').innerHTML = qr.createImgTag(4);
}


window.onload = function() {
    var peer = new Peer();

    var mirror_locations = [];

    setLightMeter(0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    const renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    const light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 0, 0, 1 );
    scene.add( light );

    camera.position.z = 5;

    var mirrors = {};
    var lasers = [];

    peer.on('open', function(id) {
        // console.log(id);
        makeQR('https://andersource.dev/lasers-in-space-client.html#hid=' + id);
        peer.on('connection', function(conn) {
            conn.uuid = uuidv4();
            conn.on('data', function(data){
                data = JSON.parse(data);

                if ('color' in data) {
                    document.getElementById('logo').setAttribute('style', 'display: none;');

                    if (mirror_locations.length == 0) {
                        return;
                    }

                    var curr_position = mirror_locations.splice(0, 1)[0];
                    const geometry = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
                    const material = new THREE.MeshBasicMaterial( { color: data.color } );
                    const cube = new THREE.Mesh( geometry, material );
                    cube.geometry.scale(1, 2, .05);

                    cube.position.x = curr_position.x;
                    cube.position.y = curr_position.y;
                    cube.position.z = curr_position.z;

                    scene.add( cube );

                    const plane_geometry = new THREE.PlaneGeometry(1, 1, 10, 10);
                    const mirror_texture = new THREE.TextureLoader().load('mirror.jpg');
                    const plane_material = new THREE.MeshLambertMaterial({map: mirror_texture});
                    const mirror_plane = new THREE.Mesh(plane_geometry, plane_material);
                    mirror_plane.geometry.scale(1, 2, 1);

                    mirror_plane.position.x = curr_position.x;
                    mirror_plane.position.y = curr_position.y;
                    mirror_plane.position.z = curr_position.z;
                    mirror_plane.translateZ(.03);
                    mirror_plane.reflective = true;
                    scene.add(mirror_plane);

                    cube.attach(mirror_plane);

                    mirrors[conn.uuid] = {
                        mirror: mirror_plane,
                        cube: cube
                    };

                    console.log(mirror_locations.length);
                    if (mirror_locations.length == 0) {
                        document.getElementById('info').setAttribute('style', 'display: none;');
                    }
                } else {
                    if (!(conn.uuid in i_alpha)) {
                        i_alpha[conn.uuid] = data.alpha;
                    }

                    data.alpha = (data.alpha - i_alpha[conn.uuid]) % 360;

                    var q = euler2quaternion(data.alpha, data.beta, data.gamma);
                    mirrors[conn.uuid].cube.setRotationFromQuaternion(q);
                }
            });
        });
    });

    const target = addTarget(scene);

    var laser_flags = {};

    setUpLevel1(scene, lasers, mirrors, mirror_locations, laser_flags);
    var obstacles = [];

    function levelOneWinCallback() {
        setTimeout(function() {
            var banner = document.getElementById('level-complete');
            banner.setAttribute('style', 'display: block;');
            setTimeout(function() {
                    banner.setAttribute('style', 'display: none;');
                    setUpLevel2(scene, lasers, mirrors, mirror_locations, laser_flags, obstacles);
                    animateLightMeter(1, 0);
                }, 5000
            );

            for (var i = 0; i < lasers.length; i++) {
                removeFromScene(scene, lasers[i].obj);
            }

            lasers.splice(0);
        }, 250);
    }

    function levelTwoWinCallback() {
        setTimeout(function() {
            var banner = document.getElementById('level-complete');
            banner.setAttribute('style', 'display: block;');
            setTimeout(function() {
                    banner.setAttribute('style', 'display: none;');
                    animateLightMeter(1, 0);
                    setUpLevel3(scene, lasers, mirrors, mirror_locations, laser_flags, obstacles);
                }, 5000
            );

            for (var i = 0; i < lasers.length; i++) {
                removeFromScene(scene, lasers[i].obj);
            }

            for (var i = 0; i < obstacles.length; i++) {
                scene.remove(obstacles[i]);
            }

            obstacles.splice(0);

            lasers.splice(0);
        }, 250);
    }

    function levelThreeWinCallback() {
        setTimeout(function() {
            var banner = document.getElementById('game-complete');
            banner.setAttribute('style', 'display: block;');

            for (var i = 0; i < obstacles.length; i++) {
                scene.remove(obstacles[i]);
            }

            scene.remove(target);
        }, 250);
    }

    var level_callbacks = [levelOneWinCallback, levelTwoWinCallback, levelThreeWinCallback];
    // var level_callbacks = [levelTwoWinCallback, levelThreeWinCallback];
    // var level_callbacks = [levelThreeWinCallback];
    var win_callback = function() {
        if (level_callbacks.length == 0) return;
        level_callbacks.splice(0, 1)[0]();
    };

    function animate() {
        requestAnimationFrame( animate );

        for (var i = 0; i < lasers.length; i++) {
            lasers[i].obj.intersect(
                lasers[i].direction,
                [
                    ...Object.values(mirrors).map(x => x.mirror),
                    ...Object.values(mirrors).map(x => x.cube),
                    target,
                    ...obstacles
                ],
                laser_flags, win_callback
            )
        }

        target.rotation.z += 0.01;
        target.rotation.y += 0.01;

        renderer.render( scene, camera );
    };

    animate();
};