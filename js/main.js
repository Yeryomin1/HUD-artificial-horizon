window.onload = function () {

    class External {
        constructor(threeScene, objNum) {
            this.objects = new THREE.Object3D();

            let material = new THREE.MeshPhongMaterial({
                color: 0xdaa520,
                specular: 0xbcbcbc,
                side: THREE.DoubleSide,
            });
            for (let i = 0; i < objNum; i++) {
                let geometry = new THREE.SphereGeometry(Math.random() * 20 + 1, Math.random() * 4 + 4, Math.random() * 4 + 4);

                let item = new THREE.Mesh(geometry, material);
                item.position.x = (Math.random() - 0.5) * 1000;
                item.position.y = (Math.random() - 0.5) * 200;
                item.position.z = -5000 + Math.random() * 4990;
                item.rotation.z = Math.random() * Math.PI;
                item.rotation.y = Math.random() * Math.PI;
                this.objects.add(item);
            }

            let planeSize = 10000;
            let geometry = new THREE.PlaneBufferGeometry(planeSize, planeSize);
            let surface = new THREE.Mesh(geometry, material);
            surface.rotation.x = Math.PI * -.5;
            surface.position.set(0, -150, 0);
            this.objects.add(surface);


            this.pivot = new THREE.Object3D();
            this.pivot.add(this.objects);


            threeScene.add(this.pivot);

        }
    }

    let vehicle = {
        pitch: 0,
        roll: 0,
        lastPitch: 0,
        lastRoll: 0,
        speed: 0
    };

    let renderer;
    let scene;
    let camera;

    function init() {
        let gui = new dat.GUI();
        gui.add(vehicle, 'pitch').min(-85).max(85).step(1);
        gui.add(vehicle, 'roll').min(-85).max(85).step(1);
        gui.add(vehicle, 'speed').min(-50).max(50).step(1);

        let width = window.innerWidth;
        let height = window.innerHeight;
        let canvas = document.getElementById('drawingCanvas');

        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);

        renderer = new THREE.WebGLRenderer({ canvas: canvas });
        renderer.setClearColor(0x000000);
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
        camera.position.set(0, 0, 1);
        camera.lookAt(0, 0, -1);

        //создаем свет
        let spotLight = new THREE.SpotLight(0xffffff);
        spotLight.position.set(0, 0, 1);

        scene.add(spotLight);
        //туман
        scene.fog = new THREE.Fog(0x000000, 2, 10000);
        //таймер
        vehicle.time = new Date();
        //искусственный горизонт
        vehicle.attitude = new Attitude(camera, scene, 0.25, 85, 85);
        //внешние объекты
        vehicle.external = new External(scene, 20);
    }

    vehicle.update = function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();


        if (vehicle.lastPitch != vehicle.pitch) {
            vehicle.dPitch = vehicle.pitch - vehicle.lastPitch;
            vehicle.lastPitch = vehicle.pitch;
        }
        else {
            vehicle.dPitch = 0;
        }

        if (vehicle.lastRoll != vehicle.roll) {
            vehicle.dRoll = vehicle.roll - vehicle.lastRoll;
            vehicle.lastRoll = vehicle.roll;
        }
        else {
            vehicle.dRoll = 0;
        }
        vehicle.attitude.update(vehicle.roll, vehicle.pitch);
        vehicle.elapsed = (new Date() - vehicle.time) / 1000;
        vehicle.time = new Date();
    }

    //Цикл анимации:
    function loop() {
        vehicle.update();
        //поворот пространства по тангажу:
        let axisOfRotation = new THREE.Vector3(1, 0, 0);
        vehicle.external.pivot.rotateOnAxis(axisOfRotation, -vehicle.dPitch * Math.PI / 180);
        //поворот пространства по крену:
        axisOfRotation = new THREE.Vector3(0, -Math.sin(vehicle.pitch * Math.PI / 180), Math.cos(vehicle.pitch * Math.PI / 180));
        vehicle.external.pivot.rotateOnAxis(axisOfRotation, vehicle.dRoll * Math.PI / 180);
        //линейное перемещение пространства вдоль оси Z:
        vehicle.external.objects.position.z += vehicle.elapsed * vehicle.speed * Math.cos(vehicle.pitch * Math.PI / 180);
        vehicle.external.objects.position.y -= vehicle.elapsed * vehicle.speed * Math.sin(vehicle.pitch * Math.PI / 180);
        //рендеринг
        renderer.render(scene, camera);
        //рекурсивная анимация
        requestAnimationFrame(function () { loop(); });
    }

    init();
    loop();

}