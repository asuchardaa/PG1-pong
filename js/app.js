let scene, camera, renderer;
let paddle1, paddle2, ball;
let gameStarted = false;

const paddleWidth = 0.3, paddleHeight = 2, paddleDepth = 0.3;
const ballSize = 0.5;

// Definice proměnných pro skóre
let score1 = 0, score2 = 0;

// Rozměry hracího pole
const fieldWidth = 20, fieldHeight = 10, fieldDepth = 10;

// Definice proměnných pro pohyb míčku
let ballSpeed = 0.05;
let ballDirection = new THREE.Vector3(-1, 0, 0);

// Definice proměnných pro pohyb pádel
let paddleSpeed = 0.1;
let upPressed = false;
let downPressed = false;
let wPressed = false;
let sPressed = false;


function initGame() {
    // Inicializace Three.js scény pro hru Pong
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // const loader = new THREE.TextureLoader();7
    // loader.load('/cv07/assets/pong-bg.jpg', function(texture) {
    //     scene.background = texture;
    // });

    createBoundary();

    // Vytvoření pádel
    // const paddleGeometry = new THREE.BoxGeometry(paddleWidth, paddleHeight, paddleDepth);
    // const paddleMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
    // paddle1 = new THREE.Mesh(paddleGeometry, paddleMaterial);
    // paddle2 = new THREE.Mesh(paddleGeometry, paddleMaterial);
    //
    // // Umístění pádel
    // paddle1.position.x = -8;
    // paddle2.position.x = 8;
    const loader = new THREE.TextureLoader();
    const textureYellow = loader.load('/cv07/assets/yellow.jpg');
    const textureBlue = loader.load('/cv07/assets/blue.jpg');

    const paddleGeometry = new THREE.BoxGeometry(paddleWidth, paddleHeight, paddleDepth);

    // Vytvoření prvního pádla s žlutou texturou
    const paddleMaterialYellow = new THREE.MeshBasicMaterial({ map: textureYellow });
    paddle1 = new THREE.Mesh(paddleGeometry, paddleMaterialYellow);
    paddle1.position.x = -8; // Nastavte podle vašich potřeb

    const paddleMaterialBlue = new THREE.MeshBasicMaterial({ map: textureBlue });
    paddle2 = new THREE.Mesh(paddleGeometry, paddleMaterialBlue);
    paddle2.position.x = 8; // Nastavte podle vašich potřeb

    // Vytvoření míčku
    const ballGeometry = new THREE.SphereGeometry(ballSize, 32, 32);
    const ballMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
    ball = new THREE.Mesh(ballGeometry, ballMaterial);

    // Přidání objektů do scény
    scene.add(paddle1);
    scene.add(paddle2);
    scene.add(ball);

    // Nastavení pozice kamery
    camera.position.z = 10;
    gameStarted = true;
    animate();
}

function animate() {
    if (!gameStarted) return;

    requestAnimationFrame(animate);

    // Aktualizace polohy míčku
    ball.position.x += ballSpeed * ballDirection.x;
    ball.position.y += ballSpeed * ballDirection.y;

    // Pohyb pádel
    if (wPressed) paddle1.position.y += paddleSpeed;
    if (sPressed) paddle1.position.y -= paddleSpeed;
    if (upPressed) paddle2.position.y += paddleSpeed;
    if (downPressed) paddle2.position.y -= paddleSpeed;

    // Kontrola kolizí
    checkCollisionWithPaddles();
    checkCollisionWithField();

    // Omezení pohybu pádel
    paddle1.position.y = Math.max(-4, Math.min(4, paddle1.position.y));
    paddle2.position.y = Math.max(-4, Math.min(4, paddle2.position.y));

    renderer.render(scene, camera);
}

function checkCollisionWithPaddles() {
    // Kontrola kolize míčku s paddle1
    if (ball.position.x - ballSize / 2 < paddle1.position.x + paddleWidth / 2 &&
        ball.position.x + ballSize / 2 > paddle1.position.x - paddleWidth / 2 &&
        ball.position.y < paddle1.position.y + paddleHeight / 2 &&
        ball.position.y > paddle1.position.y - paddleHeight / 2) {
        ballDirection.x = -ballDirection.x;
    }

    // Kontrola kolize míčku s paddle2
    if (ball.position.x - ballSize / 2 < paddle2.position.x + paddleWidth / 2 &&
        ball.position.x + ballSize / 2 > paddle2.position.x - paddleWidth / 2 &&
        ball.position.y < paddle2.position.y + paddleHeight / 2 &&
        ball.position.y > paddle2.position.y - paddleHeight / 2) {
        ballDirection.x = -ballDirection.x;
    }
}

function checkCollisionWithField() {
    // Odrážení od horní a dolní stěny
    if (ball.position.y > fieldHeight / 2 || ball.position.y < -fieldHeight / 2) {
        ballDirection.y = -ballDirection.y;
    }

    // Kontrola gólů
    if (ball.position.x > fieldWidth / 2) {
        score1++;
        resetBall();
    } else if (ball.position.x < -fieldWidth / 2) {
        score2++;
        resetBall();
    }
}

function resetBall() {
    ball.position.set(0, 0, 0); // Vrátí míček do středu
    ballDirection.set(-1, 0, 0); // Nastaví směr míčku
}

function createBoundary() {
    const boundaryMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const boundaryThickness = 0.01;
    const boundaryDepth = 0.5;

    // Vytvoření horní a dolní hranice
    const topBottomGeometry = new THREE.BoxGeometry(fieldWidth + boundaryThickness * 2, boundaryThickness, boundaryDepth);
    const topBoundary = new THREE.Mesh(topBottomGeometry, boundaryMaterial);
    const bottomBoundary = new THREE.Mesh(topBottomGeometry, boundaryMaterial);
    topBoundary.position.y = fieldHeight / 2 + boundaryThickness / 2;
    bottomBoundary.position.y = -fieldHeight / 2 - boundaryThickness / 2;

    // Vytvoření bočních hranic
    const sideGeometry = new THREE.BoxGeometry(boundaryThickness, fieldHeight, boundaryDepth);
    const leftBoundary = new THREE.Mesh(sideGeometry, boundaryMaterial);
    const rightBoundary = new THREE.Mesh(sideGeometry, boundaryMaterial);
    leftBoundary.position.x = -fieldWidth / 2 - boundaryThickness / 2;
    rightBoundary.position.x = fieldWidth / 2 + boundaryThickness / 2;

    // Přidání hranic do scény
    scene.add(topBoundary);
    scene.add(bottomBoundary);
    scene.add(leftBoundary);
    scene.add(rightBoundary);
}


// Ovládání pádel pomocí klávesnice
document.addEventListener('keydown', function(event) {
    if (event.key === 'w') wPressed = true;
    if (event.key === 's') sPressed = true;
    if (event.key === 'ArrowUp') upPressed = true;
    if (event.key === 'ArrowDown') downPressed = true;
});

document.addEventListener('keyup', function(event) {
    if (event.key === 'w') wPressed = false;
    if (event.key === 's') sPressed = false;
    if (event.key === 'ArrowUp') upPressed = false;
    if (event.key === 'ArrowDown') downPressed = false;
});

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    if (!gameStarted) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

document.getElementById('multiplayer').addEventListener('click', function() {
    document.getElementById('menu').style.display = 'none';
    initGame();
});

