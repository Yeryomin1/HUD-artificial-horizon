window.onload = function () {

    class External {
        constructor(threeScene, objNum) {
            this.objects = new THREE.Object3D();
            for (let i = 0; i < objNum; i++) {
                let geometry = new THREE.SphereGeometry(10, 1, 1);
                let material = new THREE.MeshPhongMaterial({
                    color: 'Gray',
                    specular: 0xbcbcbc,
                });
                let particle = new THREE.Mesh(geometry, material);
                particle.position.x = (Math.random() - 0.5) * 500;
                particle.position.y = (Math.random() - 0.5) * 500;
                particle.position.z = -1000 + (Math.random() - 0.5) * 1000;
                this.objects.add(particle);
            }
            threeScene.add(this.objects);
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
        gui.add(vehicle, 'pitch').min(-90).max(90).step(1);
        gui.add(vehicle, 'roll').min(-90).max(90).step(1);
        gui.add(vehicle, 'speed').min(-50).max(50).step(1);

        let width = window.innerWidth;
        let height = window.innerHeight;
        let canvas = document.getElementById('drawingCanvas');

        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);

        renderer = new THREE.WebGLRenderer({ canvas: canvas });
        renderer.setClearColor(0x000000);
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
        camera.position.set(0, 0, 1);
        camera.lookAt(0, 0, -1);
        //создаем свет, заливающий белый
        let light = new THREE.AmbientLight(0x404040);
        scene.add(light);
        let spotLight = new THREE.SpotLight(0xeeee00);
        spotLight.position.set(1000, 1000, -1000);
        //spotLight.position.set(0, 0, -200);
        scene.add(spotLight);
        //туман
        scene.fog = new THREE.Fog(0x000000, 0.01);
        //таймер
        vehicle.time = new Date();
        //искусственный горизонт
        vehicle.attitude = new Attitude(camera, scene, 0.25, 70, 70);
        //внешние объекты
        vehicle.external = new External(scene, 200);
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
        vehicle.external.objects.rotateOnAxis(axisOfRotation, -vehicle.dPitch * Math.PI / 180);
        //поворот пространства по крену:
        axisOfRotation = new THREE.Vector3(0, -Math.sin(vehicle.pitch * Math.PI / 180), Math.cos(vehicle.pitch * Math.PI / 180));
        vehicle.external.objects.rotateOnAxis(axisOfRotation, vehicle.dRoll * Math.PI / 180);
        //линейное перемещение пространства вдоль оси Z:
        vehicle.external.objects.position.z += vehicle.elapsed * vehicle.speed;
        //рендеринг
        renderer.render(scene, camera);
        //рекурсивная анимация
        requestAnimationFrame(function () { loop(); });
    }

    init();
    loop();

}