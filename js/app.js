let player_count = 0;
let timerInterval;
let startTime;
let lastGoalTime = Date.now();
let speedIncreaseInterval = 10000;
let speedIncreaseAmount = 0.005;
let selectedMap = 'default';

document.getElementById("refresh").onclick = function () {
    window.location.reload();
};

document.getElementById("p1").onclick = function () {
    player_count = 1;
    loadSelectedMap();
    prepareGame2Play();
    showGameScore();
    startTimer();
    game();
};

document.getElementById("p2").onclick = function () {
    player_count = 2;
    loadSelectedMap();
    prepareGame2Play();
    showGameScore();
    startTimer();
    game();
};

document.getElementById("settings").onclick = function () {
    document.getElementById("mapGallery").style.display = 'block';
};

document.getElementById("exit").onclick = function () {
    window.close();
}

function createObject3D() {
    return new THREE.Object3D();
}

function selectMap(mapId) {
    selectedMap = mapId;
    closeMapGallery();
}

function closeMapGallery() {
    document.getElementById("mapGallery").style.display = 'none';
}

function loadSelectedMap() {
    console.log("Načítání mapy:", selectedMap);
}

function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
    document.getElementById('timer').style.visibility = 'visible';
}

function updateTimer() {
    const elapsedTime = Date.now() - startTime;
    const minutes = Math.floor(elapsedTime / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((elapsedTime % 60000) / 1000).toString().padStart(2, '0');
    document.getElementById('timer').textContent = `${minutes}:${seconds}`;
}

function stopTimer() {
    clearInterval(timerInterval);
    document.getElementById('timer').style.visibility = 'hidden';
}

function prepareGame2Play() {
    const elementsToHide = ["p1", "p2", "campaign", "settings", "exit"];
    elementsToHide.forEach(id => document.getElementById(id).style.visibility = "hidden");
    stopTimer();
}

function showGameScore() {
    const elementsToShow = ["sc1", "sc2", "timer", "colon", "refresh"];
    const elementsToHide = ["title", "title2"];
    elementsToShow.forEach(id => document.getElementById(id).style.visibility = "visible");
    elementsToHide.forEach(id => document.getElementById(id).style.visibility = "hidden");
}

function game() {

    let camera, controls, scene, ball, steel, renderer, player1, player2;
    let goal_sound, boing_sound, winning_sound, lost_game_sound, music, audioLoader;

    //nastavení rychlostí
    const maxSpeed = 0.04;
    let minSpeed = -0.04;
    let speedStep = 0.01
    let speedX = 0.02;
    let speedY = 0.02;
    let aiSpeed = 0.03;
    let aiUp = true;
    let aiMoving = 0;

    const ballSize = 0.2;
    const playerThickness = 0.15;
    const playerFieldSize = 1.4;
    const pgroundSize = 5;

    //nastavení skóre
    let score1 = 0;
    let score2 = 0;
    let max_score = 3;

    initGame();
    animate();

    function initGame() {

        camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 3.75;
        camera.position.y = -4;

        // soundtracky, zvuk, sounds, atd...
        const listener = new THREE.AudioListener();
        camera.add(listener);
        goal_sound = new THREE.Audio(listener);
        boing_sound = new THREE.Audio(listener);
        lost_game_sound = new THREE.Audio(listener);
        winning_sound = new THREE.Audio(listener);
        music = new THREE.Audio(listener);
        audioLoader = new THREE.AudioLoader();
        playMainThemePongSound();

        // kamera
        controls = new THREE.TrackballControls(camera);
        controls.rotateSpeed = 0;
        controls.zoomSpeed = 0;
        controls.panSpeed = 0;
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;
        controls.keys = [65, 83, 68, 38, 40, 87, 83];
        controls.addEventListener('change', render);
        keys = [];

        // scéna
        scene = new THREE.Scene();
        ball = createObject3D()
        steel = createObject3D()
        player1 = createObject3D()
        player2 = createObject3D()
        loadPlaygroundLights();
        scene.add(player1);
        scene.add(player2);
        scene.add(ball);
        scene.add(steel);

        player1.position.x = 4;
        player2.position.x = -4;

        const boxGeometry = new THREE.BoxGeometry(10, 5, 0.51);
        const boxMesh = new THREE.Mesh(boxGeometry, new THREE.MeshBasicMaterial({visible: false}));
        scene.add(boxMesh);

        const edges = new THREE.EdgesGeometry(boxMesh.geometry);
        const lineMaterial = new THREE.LineDashedMaterial({
            color: 0xffffff,
            linewidth: 1,
            dashSize: 0.2,
            gapSize: 0.1
        });

        const lineSegments = new THREE.LineSegments(edges, lineMaterial);
        lineSegments.computeLineDistances();
        scene.add(lineSegments);

        loadObjects();

        // renderer
        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        window.addEventListener('resize', onWindowResize, false);
    }

    function loadObjects() {
        loader = new THREE.TextureLoader();
        const backgroundLoader = new THREE.TextureLoader();

        // Změna pozadí podle vybrané mapy
        let mapTexturePath;
        switch (selectedMap) {
            case 'map1':
                mapTexturePath = '/cv07/assets/img-background/menu-sunset-bg.png';
                break;
            case 'map2':
                mapTexturePath = '/cv07/assets/img-background/earth-bg.png';
                break;
            case 'map3':
                mapTexturePath = '/cv07/assets/img-background/night-stars-bg.jpg';
                break;
            case 'map4':
                mapTexturePath = '/cv07/assets/img-background/red-forest-bg.jpg';
                break;
            case 'map5':
                mapTexturePath = '/cv07/assets/img-background/crystal-bg.avif';
                break;
            case 'map6':
                mapTexturePath = '/cv07/assets/img-background/almost-minecraft-bg.jpg';
                break;
            case 'map7':
                mapTexturePath = '/cv07/assets/img-background/black-white-mountains-bg.jpg';
                break;
            default:
                mapTexturePath = '/cv07/assets/img-background/menu-background.png';
        }

        backgroundLoader.load(mapTexturePath, function (texture) {
            scene.background = texture;
        });

        loader.load(
            'assets/football-bg.jpg',
            function (texture) {
                const steel_geometry = new THREE.BoxGeometry(10, pgroundSize, 0.1);
                const tex_material = new THREE.MeshBasicMaterial({
                    map: texture
                });

                const steel_mesh = new THREE.Mesh(steel_geometry, tex_material);
                steel.add(steel_mesh);

                steel.position.z = -0.1 / 2 - 0.51 / 2;

                render();

            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function () {
                console.log('An error happened');
            }
        );

        loader.load(
            'assets/red.jpg',
            function (texture) {
                const player_geometry = new THREE.BoxGeometry(playerThickness, playerFieldSize, 0.51);
                const tex_material = new THREE.MeshBasicMaterial({
                    map: texture
                });
                const player1_mesh = new THREE.Mesh(player_geometry, tex_material);
                player1.add(player1_mesh);

                render();
            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function () {
                console.log('An error happened');
            }
        );

        loader.load(
            'assets/blue.jpg',
            function (texture) {

                const player_geometry = new THREE.BoxGeometry(playerThickness, playerFieldSize, 0.51);
                const tex_material = new THREE.MeshBasicMaterial({
                    map: texture
                });
                const player2_mesh = new THREE.Mesh(player_geometry, tex_material);
                player2.add(player2_mesh);

                render();
            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function () {
                console.log('An error happened');
            }
        );

        // Load ball texture
        var loader = new THREE.TextureLoader();
        loader.load('/cv07/assets/football-ball.jpg', function (texture) {
            const ballGeometry = new THREE.SphereGeometry(ballSize, 100, 100);
            const ballMaterial = new THREE.MeshPhongMaterial({map: texture});

            const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
            ball.add(ballMesh);
        });
    }

    function loadPlaygroundLights() {
        // lights 1-4
        const light1 = new THREE.DirectionalLight(0x777777);
        light1.position.set(0, -3, 5).normalize();
        scene.add(light1);

        const light2 = new THREE.DirectionalLight(0x333333);
        light2.position.set(-5, -3, 5).normalize();
        scene.add(light2);

        const light3 = new THREE.DirectionalLight(0x333333);
        light3.position.set(5, -3, 5).normalize();
        scene.add(light3);

        const light4 = new THREE.DirectionalLight(0x222222);
        light4.position.set(-5, -5, 0).normalize();
        scene.add(light4);

        const light5 = new THREE.DirectionalLight(0x222222);
        light5.position.set(5, -5, 0).normalize();
        scene.add(light5);
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        controls.handleResize();
        render();
    }

    function animate() {
        requestAnimationFrame(animate);

        playgroundBorderCollision();
        ball.position.y += speedY;

        if (ball.position.x >= pgroundSize - ballSize / 2 || ball.position.x <= -pgroundSize + ballSize / 2) {

            updateGameScore();

            if (score1 === max_score) {
                gameOver(1);
            }
            if (score2 === max_score) {
                gameOver(2);
            }
            changeRandomlyBallDirection();
            resetBallPosition();
        }

        if (Date.now() - lastGoalTime > speedIncreaseInterval) {
            increaseBallSpeed();
            lastGoalTime = Date.now(); // Reset času pro další zvýšení rychlosti
        }

        if (ball.position.x >= pgroundSize - ballSize / 2 - 0.25 || ball.position.x <= -pgroundSize + ballSize / 2 + 0.25) {
            playGoalSound();
        }

        playerWithBallCollision();
        playerOneSettings();

        if (player_count === 2)
            playerTwoSettings();

        if (player_count === 1)
            aiControlSettings();


        ball.position.x += speedX;
        controls.update();
        render();

        document.body.addEventListener("keydown", function (e) {
            keys[e.keyCode] = true;
        });
        document.body.addEventListener("keyup", function (e) {
            keys[e.keyCode] = false;
        });

    }

    function playerOneSettings() {
        /**
         * Ovládání hráče 1
         */
        if (keys[38]) {
            if (player1.position.y + playerFieldSize / 2 < pgroundSize / 2)
                player1.position.y += 0.03;
        }
        if (keys[40]) {
            if (player1.position.y - playerFieldSize / 2 > -pgroundSize / 2)
                player1.position.y -= 0.03;
        }
    }

    function playerTwoSettings() {
        /**
         * Ovládání hráče 2
         */
        if (keys[87]) {
            if (player2.position.y + playerFieldSize / 2 < pgroundSize / 2)
                player2.position.y += 0.03;
        }
        if (keys[83]) {
            if (player2.position.y - playerFieldSize / 2 > -pgroundSize / 2)
                player2.position.y -= 0.03;
        }
    }

    function aiControlSettings() {
        /**
         * Ovládání AI a jeho nastavení
         * @type {number}
         */
        aiSpeed = 0.015;

        // "jednoduchá" logika AI
        if (player2.position.y + 0.33 > ball.position.y)
            aiUp = false;
        if (player2.position.y - 0.33 < ball.position.y)
            aiUp = true;

        // Pohyb AI
        if (aiUp && (player2.position.y + playerFieldSize / 2 < pgroundSize / 2)) {
            player2.position.y += aiSpeed;
        } else if (!aiUp && (player2.position.y - playerFieldSize / 2 > -pgroundSize / 2)) {
            player2.position.y -= aiSpeed;
        }


        if (aiUp && (player2.position.y + playerFieldSize / 2 < pgroundSize / 2)) {
            player2.position.y += aiSpeed;
            aiMoving = 1;
        } else if (!aiUp && (player2.position.y - playerFieldSize / 2 > -pgroundSize / 2)) {
            player2.position.y -= aiSpeed;
            aiMoving = -1;
        } else aiMoving = 0;


    }

    function render() {
        renderer.render(scene, camera);
    }

    function resetBallPosition() {
        const date = Date.now();
        let currentDate = null;
        do {
            currentDate = Date.now();
        } while (currentDate - date < 1000);

        player1.position.y = 0;
        player2.position.y = 0;
        ball.position.x = 0;
        ball.position.y = 0;
        render();
    }

    function playgroundBorderCollision() {
        if (ball.position.y >= 2.5 - ballSize / 2 || ball.position.y <= -2.5 + ballSize / 2) {
            speedY = -speedY;
            playBoingSound();
        }
    }

    function updateGameScore() {
        if (ball.position.x < 0) {
            score1++;
            document.getElementById('sc1').innerHTML = score1;
            lastGoalTime = Date.now();
            resetSpeed();
        }
        if (ball.position.x > 0) {
            score2++;
            document.getElementById('sc2').innerHTML = score2;
            lastGoalTime = Date.now();
            resetSpeed();
        }
    }

    function increaseBallSpeed() {
        speedY += (speedY > 0 ? speedIncreaseAmount : -speedIncreaseAmount);
        speedX += (speedX > 0 ? speedIncreaseAmount : -speedIncreaseAmount);
    }

    function resetSpeed() {
        speedY = 0.02;
        speedX = 0.02;
    }

    function playerWithBallCollision() {
        /**
         * Kolize míče s hráči
         */
        if (ball.position.x <= player2.position.x + ballSize / 2 + playerThickness / 2
            && (!(ball.position.x < player2.position.x))
            && ball.position.y < player2.position.y + playerFieldSize / 2 + ballSize / 2
            && ball.position.y > player2.position.y - playerFieldSize / 2 - ballSize / 2) {
            playBoingSound();
            speedX = -speedX;
            if (keys[87] && speedY < maxSpeed) speedY += speedStep;
            if (keys[83] && speedY > minSpeed) speedY -= speedStep;
            {
                if (aiMoving === 1 && speedY < maxSpeed) speedY += speedStep;
                if (aiMoving === -1 && speedY > minSpeed) speedY -= speedStep;
            }
        }
        if (ball.position.x > player1.position.x - ballSize / 2 - playerThickness / 2
            && (!(ball.position.x > player1.position.x))
            && ball.position.y < player1.position.y + playerFieldSize / 2 + ballSize / 2
            && ball.position.y > player1.position.y - playerFieldSize / 2 - ballSize / 2) {
            playBoingSound();
            speedX = -speedX;
            if (keys[38]) speedY += speedStep;
            if (keys[40]) speedY -= speedStep;
        }
    }

    function changeRandomlyBallDirection() {
        speedY = 0.02;
        rand = Math.random();
        if (rand < 0.5)
            speedX = -speedX;
        if (rand < 0.25 || rand >= 0.75)
            speedY = -speedY;
    }

    // Z V U K Y
    function playGoalSound() {
        audioLoader.load('audio/goal.mp3',
            function (buffer) {
                goal_sound.setBuffer(buffer);
                goal_sound.setLoop(false);
                goal_sound.setVolume(0.9);
                goal_sound.play();
            }
        );
    }

    function playBoingSound() {
        audioLoader.load('audio/test-boing.flac',
            function (buffer) {
                boing_sound.setBuffer(buffer);
                boing_sound.setLoop(false);
                boing_sound.setVolume(0.4);
                boing_sound.play();
            }
        );
    }

    function playLostGameSound() {
        audioLoader.load('audio/lost-game-sound.m4a',
            function (buffer) {
                lost_game_sound.setBuffer(buffer);
                lost_game_sound.setLoop(false);
                lost_game_sound.setVolume(0.8);
                lost_game_sound.play();
            }
        );
    }

    function playGameWinningSound() {
        audioLoader.load('audio/score-sound.wav',
            function (buffer) {
                winning_sound.setBuffer(buffer);
                winning_sound.setLoop(false);
                winning_sound.setVolume(0.7);
                winning_sound.play();
            }
        );
    }

    function playMainThemePongSound() {
        audioLoader.load('audio/main-theme-pong.mp3',
            function (buffer) {
                music.setBuffer(buffer);
                music.setLoop(true);
                music.setVolume(1.5);
                music.play();
            }
        );
    }

    async function gameOver(winner) {
        //konec hry, jeden hráč vyhrál
        score1 = 0;
        score2 = 0;
        document.getElementById('sc1').innerHTML = score1;
        document.getElementById('sc2').innerHTML = score2;
        if (player_count === 2) {
            document.getElementById('info').innerHTML = "Player " + winner + " wins!";
            if (winner === 2) document.getElementById('info').style.color = "blue";
            else document.getElementById('info').style.color = "red";
            playGameWinningSound();
        } else {
            document.getElementById('info').style.color = "red";
            if (winner === 2) {
                playLostGameSound();
                document.getElementById('info').innerHTML = "Game over!";
            } else {
                document.getElementById('info').innerHTML = "You win!";
                playGameWinningSound();
            }
        }
        setTimeout(function () {
            document.getElementById('info').innerHTML = " "
        }, 2500);
    }
}

