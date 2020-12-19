class Attitude {
    constructor(camera, scene, radius, maxPitch, maxRoll) {
        //тангаж:
        //устанавливаем кратный 30 с запасом в большую сторону предел значений угла:
        if (maxPitch > 90) maxPitch = 90;
        this.maxPitch = maxPitch;
        maxPitch /= 30;
        maxPitch = Math.ceil(maxPitch) * 30;

        //крен:
        if (maxRoll > 90) maxRoll = 90;
        this.maxRoll = maxRoll;

        //определяем длину силуэта:
        let skeletonLength = radius / Math.sin(maxPitch * Math.PI / 180);
        //строим контурный силуэт:
        let geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(0, 0, -skeletonLength / 4));
        geometry.vertices.push(new THREE.Vector3(-radius, 0, 0));
        geometry.vertices.push(new THREE.Vector3(0, 0, -skeletonLength));
        geometry.vertices.push(new THREE.Vector3(radius, 0, 0));
        geometry.vertices.push(new THREE.Vector3(0, 0, -skeletonLength / 4)); // замыкаем контур
        //контурный материал:
        let material = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 1 });
        //создаем линию контура:
        this.skeleton = new THREE.Line(geometry, material);
        scene.add(this.skeleton);

        //создаем шкалу тангажа:
        let pitchScaleStep = maxPitch / 3;

        let textLabelsPos = [];//позиции текстовых меток шкалы
        for (let i = 0; i < 7; i++) {
            let lineGeometry = new THREE.Geometry();

            //левый и правый края линии метки:
            let leftPoint = new THREE.Vector3(-radius / 10,
                skeletonLength * Math.sin((maxPitch - pitchScaleStep * i) * Math.PI / 180),
                -skeletonLength * Math.cos((maxPitch - pitchScaleStep * i) * Math.PI / 180));
            let rightPoint = new THREE.Vector3();
            rightPoint.copy(leftPoint);
            rightPoint.x += (radius / 5);
            //линия метки:
            lineGeometry.vertices.push(leftPoint);
            lineGeometry.vertices.push(rightPoint);
            let line = new THREE.Line(lineGeometry, material);
            scene.add(line);
            //позиция текстовой метки
            let textPos = new THREE.Vector3();
            textPos.copy(leftPoint);
            textLabelsPos.push(textPos);
        }

        //создаем шкалу крена:
        let rollScaleStep = 30;
        this.rollLines = [];
        for (let i = 0; i < 12; i++) {
            if (i != 3 && i != 9) {//не ставим верхнюю и нижнюю метки
                let lineGeometry = new THREE.Geometry();
                //края линии метки:
                lineGeometry.vertices.push(new THREE.Vector3(-Math.cos(
                    i * rollScaleStep * Math.PI / 180) * radius * 1.1,
                    Math.sin(i * rollScaleStep * Math.PI / 180) * radius * 1.1,
                    0));
                lineGeometry.vertices.push(new THREE.Vector3(-Math.cos(
                    i * rollScaleStep * Math.PI / 180) * radius * 0.9,
                    Math.sin(i * rollScaleStep * Math.PI / 180) * radius * 0.9,
                    0));

                this.rollLines.push(new THREE.Line(lineGeometry, material));
                scene.add(this.rollLines[this.rollLines.length - 1]);
            }
        }

        //текстовые метки:
        for (let i = 0; i < 7; i++) {
            let labelText = document.createElement('div');
            labelText.style.position = 'absolute';
            labelText.style.width = 100;
            labelText.style.height = 100;
            labelText.style.color = "Lime";
            labelText.style.fontSize = window.innerHeight / 35 + "px";
            labelText.innerHTML = Math.abs(maxPitch - pitchScaleStep * i);

            let position3D = textLabelsPos[i];
            let position2D = to2D(position3D);

            labelText.style.top = (position2D.y) * 100 / window.innerHeight - 2 + '%';
            labelText.style.left = (position2D.x) * 100 / window.innerWidth - 4 + '%';
            document.body.appendChild(labelText);
        }


        function to2D(pos) {

            let vector = pos.project(camera);
            vector.x = window.innerWidth * (vector.x + 1) / 2;
            vector.y = -window.innerHeight * (vector.y - 1) / 2;

            return vector;
        }

    }


    update(roll, pitch) {
        //проверка выхода за ограничение:
        if (pitch > this.maxPitch) pitch = this.maxPitch;
        if (pitch < -this.maxPitch) pitch = -this.maxPitch;

        if (roll > this.maxRoll) roll = this.maxRoll;
        if (roll < -this.maxRoll) roll = -this.maxRoll;

        //установка силуэта в положение, соответствующее текущим значениям крена и тангажа
        this.skeleton.rotation.z = -roll * Math.PI / 180;
        this.skeleton.rotation.x = pitch * Math.PI / 180;

        //перемещаем только отметки крена:
        let marksNum = this.rollLines.length;
        for (let i = 0; i < marksNum; i++)
            this.rollLines[i].rotation.x = pitch * Math.PI / 180;
    }
}