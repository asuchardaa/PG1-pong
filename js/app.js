let player_count = 0;
let timerInterval, startTime;
let lastGoalTime = Date.now();
let turboModeActive = false;
const speedIncreaseInterval = 10000;
const speedIncreaseAmount = 0.005;
let selectedMap = 'default';
let frameCount = 0;
let originalPaddleSize = 1.0;
let maxPaddleSize = 2.0;
let minPaddleSize = 0.5;

document.getElementById("back-to-menu").onclick = function () {
    window.location.reload();
};

document.getElementById("singleplayer").onclick = function () {
    player_count = 1;
    loadSelectedMap();
    prepareGame2Play();
    showGameScore();
    startTimer();
    game();
};

document.getElementById("multiplayer").onclick = function () {
    player_count = 2;
    loadSelectedMap();
    prepareGame2Play();
    showGameScore();
    startTimer();
    game();
};

document.getElementById("turboMode").onclick = function () {
    player_count = 1;
    turboModeActive = true;
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

/**
 * Funkce, která jen zpřehlední kód a zkrátí jej
 * @returns {Object3D}
 */
function createObject3D() {
    return new THREE.Object3D();
}

/**
 * Funkce pro výběr zvolené mapy a zavření galerie
 * @param mapId
 */
function selectMap(mapId) {
    selectedMap = mapId;
    closeMapGallery();
}

/**
 * Funkce pro zavření galerie s mapami
 */
function closeMapGallery() {
    document.getElementById("mapGallery").style.display = 'none';
}

/**
 * Funkce pro načtení vybrané mapy
 */
function loadSelectedMap() {
    console.log("Načítání mapy:", selectedMap);
}

/**
 * Funkce pro spuštění časovače
 */
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
    document.getElementById('timer').style.visibility = 'visible';
}

/**
 * Funkce pro aktualizaci časovače
 */
function updateTimer() {
    const elapsedTime = Date.now() - startTime;
    const minutes = Math.floor(elapsedTime / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((elapsedTime % 60000) / 1000).toString().padStart(2, '0');
    document.getElementById('timer').textContent = `${minutes}:${seconds}`;
}

/**
 * Funkce pro zastavení časovače
 */
function stopTimer() {
    clearInterval(timerInterval);
    document.getElementById('timer').style.visibility = 'hidden';
}

/**
 * Funkce pro přípravu hry
 */
function prepareGame2Play() {
    const elementsToHide = ["singleplayer", "multiplayer", "turboMode", "settings", "exit"];
    elementsToHide.forEach(id => document.getElementById(id).style.visibility = "hidden");
    stopTimer();
}

/**
 * Funkce pro zobrazení skóre
 */
function showGameScore() {
    const elementsToShow = ["player-two-score", "player-one-score", "timer", "colon", "back-to-menu"];
    const elementsToHide = ["title", "title2"];
    elementsToShow.forEach(id => document.getElementById(id).style.visibility = "visible");
    elementsToHide.forEach(id => document.getElementById(id).style.visibility = "hidden");
}

/**
 * Funkce pro nastavení základních parametrů hry
 */
function game() {

    let camera, controls, scene, ball, steel, renderer, player1, player2;
    let goalSoundEffect, bounceSoundEffect, winningSoundEffect, lostGameSoundEffect, music, audioLoader;

    // nastavení rychlostí
    const maxSpeed = 0.08;
    let minSpeed = -0.08;
    let speedStep = 0.02;
    let speedX = 0.04;
    let speedY = 0.04;
    let aiSpeed = 0.04;
    let aiUp = true;
    let aiMoving = 0;

    const ballSize = 0.2;
    const playerThickness = 0.15;
    const playerFieldSize = 1.4;
    const pgroundSize = 5;

    // nastavení skóre
    let score1 = 0;
    let score2 = 0;
    let maxScore = 5;

    if (turboModeActive) {
        speedX = 0.04;
        speedY = 0.04;
        aiSpeed = 0.12;
    }

    initGame();
    animate();

    /**
     * Funkce pro inicializaci celé hry (zvuky, kamera, scéna, světla, atd...)
     */
    function initGame() {

        camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 3.75;
        camera.position.y = -4;

        // soundtracky, zvuk, sounds, atd...
        const listener = new THREE.AudioListener();
        camera.add(listener);
        goalSoundEffect = new THREE.Audio(listener);
        bounceSoundEffect = new THREE.Audio(listener);
        lostGameSoundEffect = new THREE.Audio(listener);
        winningSoundEffect = new THREE.Audio(listener);
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

    /**
     * Funkce pro načtení objektu
     */
    function loadObjects() {
        loader = new THREE.TextureLoader();
        const backgroundLoader = new THREE.TextureLoader();

        const mapTextures = [
            '/cv07/assets/img-background/menu-sunset-bg.png',
            '/cv07/assets/img-background/earth-bg.png',
            '/cv07/assets/img-background/night-stars-bg.jpg',
            '/cv07/assets/img-background/red-forest-bg.jpg',
            '/cv07/assets/img-background/crystal-bg.avif',
            '/cv07/assets/img-background/almost-minecraft-bg.jpg',
            '/cv07/assets/img-background/black-white-mountains-bg.jpg'
        ];

        let mapTexturePath;
        switch (selectedMap) {
            case 'map1':
                mapTexturePath = mapTextures[0];
                break;
            case 'map2':
                mapTexturePath = mapTextures[1];
                break;
            case 'map3':
                mapTexturePath = mapTextures[2];
                break;
            case 'map4':
                mapTexturePath = mapTextures[3];
                break;
            case 'map5':
                mapTexturePath = mapTextures[4];
                break;
            case 'map6':
                mapTexturePath = mapTextures[5];
                break;
            case 'map7':
                mapTexturePath = mapTextures[6];
                break;
            default:
                mapTexturePath = mapTextures[Math.floor(Math.random() * mapTextures.length)];
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

    /**
     * Funkce pro načtení světel
     */
    function loadPlaygroundLights() {
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        // smerove
        const light1 = new THREE.DirectionalLight(0xaaaaaa);
        light1.position.set(0, -3, 5).normalize();
        scene.add(light1);

        const light2 = new THREE.DirectionalLight(0x777777);
        light2.position.set(-5, -3, 5).normalize();
        scene.add(light2);

        const light3 = new THREE.DirectionalLight(0x777777);
        light3.position.set(5, -3, 5).normalize();
        scene.add(light3);

        // bodove
        const spotLight = new THREE.SpotLight(0xffffff);
        spotLight.position.set(0, 10, 10);
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.1;
        scene.add(spotLight);
    }

    /**
     * Funkce na vykreslení scény dle velikosti okna
     */
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        controls.handleResize();
        render();
    }

    /**
     * Funkce na vykreslení scény
     */
    function animate() {
        requestAnimationFrame(animate);
        frameCount++;

        playgroundBorderCollision();
        ball.position.y += speedY;

        if (ball.position.x >= pgroundSize - ballSize / 2 || ball.position.x <= -pgroundSize + ballSize / 2) {

            updateGameScore();

            if (score1 === maxScore) {
                gameOver(1);
            }
            if (score2 === maxScore) {
                gameOver(2);
            }
            changeRandomlyBallDirection();
            resetPlayerAndBallPosition();
        }

        if (turboModeActive) {
            if (frameCount % 500 === 0) {
                randomEvents();
            }
        }

        if (!turboModeActive) {
            if (Date.now() - lastGoalTime > speedIncreaseInterval) {
                increaseBallSpeed();
                lastGoalTime = Date.now(); // Reset času
            }
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

    /**
     * Ovládání hráče 1
     */
    function playerOneSettings() {
        if (keys[38]) {
            if (player1.position.y + playerFieldSize / 2 < pgroundSize / 2)
                player1.position.y += 0.1;
        }
        if (keys[40]) {
            if (player1.position.y - playerFieldSize / 2 > -pgroundSize / 2)
                player1.position.y -= 0.1;
        }
    }

    /**
     * Ovládání hráče 2
     */
    function playerTwoSettings() {
        if (keys[87]) {
            if (player2.position.y + playerFieldSize / 2 < pgroundSize / 2)
                player2.position.y += 0.1;
        }
        if (keys[83]) {
            if (player2.position.y - playerFieldSize / 2 > -pgroundSize / 2)
                player2.position.y -= 0.1;
        }
    }

    /**
     * Funkce pro ovládání AI
     */
    function aiControlSettings() {
        aiSpeed = 0.028;

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

    /**
     * Funkce pro vykreslení scény
     */
    function render() {
        renderer.render(scene, camera);
    }

    /**
     * Funkce pro reset míčku a hráče po gólu
     */
    function resetPlayerAndBallPosition() {
        const date = Date.now();
        let currentDate = null;
        do {
            currentDate = Date.now();
        } while (currentDate - date < 1000);

        if (turboModeActive) {
            setTurboModeSpeed();
        }

        player1.position.y = 0;
        player2.position.y = 0;
        ball.position.x = 0;
        ball.position.y = 0;
        render();
    }

    /**
     * Funkce pro odrážení míčku od herního pole
     */
    function playgroundBorderCollision() {
        if (ball.position.y >= 2.5 - ballSize / 2 || ball.position.y <= -2.5 + ballSize / 2) {
            speedY = -speedY;
            playBounceSound();
        }
    }

    /**
     * Funkce pro nastavení skóre
     */
    function updateGameScore() {
        if (ball.position.x < 0) {
            score1++;
            document.getElementById('player-two-score').innerHTML = score1;
            lastGoalTime = Date.now();
            resetSpeed();
        }
        if (ball.position.x > 0) {
            score2++;
            document.getElementById('player-one-score').innerHTML = score2;
            lastGoalTime = Date.now();
            resetSpeed();
        }

        if (turboModeActive) {
            setTurboModeSpeed();
        }
    }

    /**
     * Funkce, která nastavuje rychlost pro Turbo mód
     */
    function setTurboModeSpeed() {
        speedX = 0.05;
        speedY = 0.05;
    }

    /**
     * Funkce pro nastavení vyšší rychlosti míčku
     */
    function increaseBallSpeed() {
        speedY += (speedY > 0 ? speedIncreaseAmount : -speedIncreaseAmount);
        speedX += (speedX > 0 ? speedIncreaseAmount : -speedIncreaseAmount);
    }

    /**
     * Funkce pro nastavení rychlosti míčku na původní hodnotu
     */
    function resetSpeed() {
        speedY = 0.04;
        speedX = 0.04;
    }

    /**
     * Funkce pro mechanismus náhodných udállostí - turbo mód
     */
    function randomEvents() {
        if (!turboModeActive) return;

        const randomEventText = document.getElementById('randomEventText');
        const randomEvent = Math.floor(Math.random() * 4);

        switch (randomEvent) {
            case 0:
                changeBallDirectionRandomly();
                randomEventText.textContent = "Náhodný Směr Míčku";
                break;
            case 1:
                changePaddleSizeRandomly();
                randomEventText.textContent = "Změna Velikosti Pádla";
                break;
            case 2:
                temporarySpeedBoost();
                randomEventText.textContent = "Rychlostní Boost";
                break;
            case 3:
                toggleBallVisibility();
                randomEventText.textContent = "Neviditelný Míček";
                break;
        }

        setTimeout(() => {
            randomEventText.textContent = "";
        }, 4000);
    }

    /**
     * Funkce pro změnu směru míčku
     */
    function changeBallDirectionRandomly() {
        speedX = (Math.random() < 0.5 ? -1 : 1) * Math.abs(speedX);
        speedY = (Math.random() < 0.5 ? -1 : 1) * Math.abs(speedY);
    }

    /**
     * Funkce pro zvětšení a zmenšení pádla
     */
    function changePaddleSizeRandomly() {
        const newSize = Math.random() * (maxPaddleSize - minPaddleSize) + minPaddleSize;
        player1.scale.y = newSize;
        player2.scale.y = newSize;

        setTimeout(() => {
            player1.scale.y = originalPaddleSize;
            player2.scale.y = originalPaddleSize;
        }, 5000);
    }

    /**
     * Funkce pro zvýšení rychlosti míčku
     */
    function temporarySpeedBoost() {
        const originalSpeedX = speedX;
        const originalSpeedY = speedY;

        speedX *= 1.5;
        speedY *= 1.5;

        setTimeout(() => {
            speedX = originalSpeedX;
            speedY = originalSpeedY;
        }, 5000);
    }

    /**
     * Funkce pro zneviditelnění míčku
     */
    function toggleBallVisibility() {
        ball.visible = false;
        setTimeout(() => {
            ball.visible = true;
        }, 3000);
    }

    /**
     * Funkce pro logiku kolize míče s hráči
     */
    function playerWithBallCollision() {
        /**
         * Kolize míče s hráči
         */
        if (ball.position.x <= player2.position.x + ballSize / 2 + playerThickness / 2
            && (!(ball.position.x < player2.position.x))
            && ball.position.y < player2.position.y + playerFieldSize / 2 + ballSize / 2
            && ball.position.y > player2.position.y - playerFieldSize / 2 - ballSize / 2) {
            playBounceSound();
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
            playBounceSound();
            speedX = -speedX;
            if (keys[38]) speedY += speedStep;
            if (keys[40]) speedY -= speedStep;
        }
    }

    /**
     * Funkce pro změnu náhodného směru míčku
     */
    function changeRandomlyBallDirection() {
        speedY = 0.02;
        let rand = Math.random();
        if (rand < 0.5)
            speedX = -speedX;
        if (rand < 0.25 || rand >= 0.75)
            speedY = -speedY;
    }

    // Z V U K Y

    /**
     * Funkce pro přehrání zvuku gólu
     */
    function playGoalSound() {
        audioLoader.load('audio/goal.mp3',
            function (buffer) {
                goalSoundEffect.setBuffer(buffer);
                goalSoundEffect.setLoop(false);
                goalSoundEffect.setVolume(0.9);
                goalSoundEffect.play();
            }
        );
    }

    /**
     * Funkce pro přehrání zvuku odražení míčku
     */
    function playBounceSound() {
        audioLoader.load('audio/bounce.flac',
            function (buffer) {
                bounceSoundEffect.setBuffer(buffer);
                bounceSoundEffect.setLoop(false);
                bounceSoundEffect.setVolume(0.4);
                bounceSoundEffect.play();
            }
        );
    }

    /**
     * Funkce pro přehrání zvuku prohry
     */
    function playLostGameSound() {
        audioLoader.load('audio/lost-game-sound.m4a',
            function (buffer) {
                lostGameSoundEffect.setBuffer(buffer);
                lostGameSoundEffect.setLoop(false);
                lostGameSoundEffect.setVolume(0.8);
                lostGameSoundEffect.play();
            }
        );
    }

    /**
     * Funkce pro přehrání zvuku vítězství
     */
    function playGameWinningSound() {
        audioLoader.load('audio/score-sound.wav',
            function (buffer) {
                winningSoundEffect.setBuffer(buffer);
                winningSoundEffect.setLoop(false);
                winningSoundEffect.setVolume(0.7);
                winningSoundEffect.play();
            }
        );
    }

    /**
     * Funkce pro přehrání zvuku hlavního menu
     */
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

    /**
     * Funkce pro zobrazení vítěze
     * @param winner
     */
    function gameOver(winner) {
        //konec hry, jeden hráč vyhrál
        score1 = 0;
        score2 = 0;
        document.getElementById('player-one-score').innerHTML = score1;
        document.getElementById('player-two-score').innerHTML = score2;
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

    function calculateResolutionRatio() {
        const referenceResolution = {width: 1920, height: 1080};
        const currentResolution = {width: window.innerWidth, height: window.innerHeight};
        return Math.sqrt((currentResolution.width * currentResolution.height) / (referenceResolution.width * referenceResolution.height));
    }

    function updateSpeeds() {
        const ratio = calculateResolutionRatio();

        const paddleSpeed = 0.06 * ratio; // Původní rychlost * poměr
        const aiSpeed = 0.04 * ratio; // Původní rychlost AI * poměr

        // Přizpůsobení rychlosti míčku
        let speedX = 0.04 * ratio; // Původní rychlost X * poměr
        let speedY = 0.04 * ratio; // Původní rychlost Y * poměr
        let speedStep = 0.01 * ratio; // Původní rychlost změny rychlosti * poměr
        let maxSpeed = 0.2 * ratio; // Původní maximální rychlost * poměr
        let minSpeed = 0.04 * ratio; // Původní minimální rychlost * poměr
        let ballSize = 0.1 * ratio; // Původní velikost míčku * poměr
        let playerThickness = 0.1 * ratio; // Původní tloušťka hráče * poměr
    }

    // Volání updateSpeeds při změně velikosti okna
    window.addEventListener('resize', updateSpeeds);

// Počáteční aktualizace rychlostí při načtení
    updateSpeeds();
}