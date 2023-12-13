var player_count = 0;
var diff = "";

document.getElementById("refresh").onclick = function() {
    window.location.reload();
};

document.getElementById("p1").onclick = function() {
    player_count = 1;
    prepare_game();
    show_diff();
};

document.getElementById("p2").onclick = function() {
    player_count = 2;
    prepare_game();
    show_score();
    game();
};

document.getElementById("easy").onclick = function() {
    diff = "easy";
    hide_diff();
    show_score();
    game();
};

document.getElementById("normal").onclick = function() {
    diff = "normal";
    hide_diff();
    show_score();
    game();
};

document.getElementById("hard").onclick = function() {
    diff = "hard";
    hide_diff();
    show_score();
    game();
};

function prepare_game(){
    document.getElementById("p1").style.visibility = "hidden";
    document.getElementById("p2").style.visibility = "hidden";
}

function show_diff(){
    document.getElementById("easy").style.visibility = "visible";
    document.getElementById("normal").style.visibility = "visible";
    document.getElementById("hard").style.visibility = "visible";
}

function hide_diff(){
    document.getElementById("easy").style.visibility = "hidden";
    document.getElementById("normal").style.visibility = "hidden";
    document.getElementById("hard").style.visibility = "hidden";
}

function show_score(){
    document.getElementById("sc1").style.visibility = "visible";
    document.getElementById("sc2").style.visibility = "visible";
    document.getElementById("title").style.visibility = "hidden";
    document.getElementById("title2").style.visibility = "hidden";
    document.getElementById("refresh").style.visibility = "visible";
}

function game() {

    var camera, controls, scene, ball, steel, renderer, player1, player2, loader; //příprava proměnných pro renderování
    var smash_sound, boing_sound, yay_sound, boo_sound, music, audioLoader; //příprava proměnných pro hudbu

    //nastavení rychlostí
    var speed_y = 0.02;
    var max_speed = 0.04;
    var min_speed = -0.04;
    var speed_step = 0.01
    var speed_x = 0.02;
    var ai_speed = 0.03;
    var ai_up = true;
    var ai_moving = 0;

    var ball_size = 0.2 //velikost míčku
    var player_thisckness = 0.15; //tloušťka hráče
    var player_size = 1.4; //velikost plochy hráče
    var pground_size = 5;

    //nastavení skóre
    var score1 = 0;
    var score2 = 0;
    var max_score = 5;

    init();
    animate();

    function init() {

        camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 1000 );
        camera.position.z = 3.75;
        camera.position.y = -4;

        //příprava soundtracku
        var listener = new THREE.AudioListener();
        camera.add( listener );
        smash_sound = new THREE.Audio( listener );
        boing_sound = new THREE.Audio( listener );
        boo_sound = new THREE.Audio( listener );
        yay_sound = new THREE.Audio( listener );
        music = new THREE.Audio( listener );
        audioLoader = new THREE.AudioLoader();
        play_main_theme();

        //příprava kamery
        controls = new THREE.TrackballControls( camera );
        controls.rotateSpeed = 0;
        controls.zoomSpeed = 0;
        controls.panSpeed = 0;
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;
        controls.keys = [ 65, 83, 68, 38, 40, 87, 83 ];
        controls.addEventListener( 'change', render );
        keys = [];

        //příprava scény
        scene = new THREE.Scene();
        ball = new THREE.Object3D();
        steel = new THREE.Object3D();
        player1 = new THREE.Object3D();
        player2 = new THREE.Object3D();
        load_lights();
        scene.add( player1 );
        scene.add( player2 );
        scene.add( ball );
        scene.add( steel );

        //nastavení pozice hráče
        player1.position.x = 4;
        player2.position.x = -4;

        //ohraničení
        var boxGeometry = new THREE.BoxGeometry(10, 5, 0.51);
        var boxMesh = new THREE.Mesh(boxGeometry, new THREE.MeshBasicMaterial({ visible: false })); // Invisible mesh
        scene.add(boxMesh);

        // Calculate the edges from the box geometry
        var edges = new THREE.EdgesGeometry(boxMesh.geometry);

        // Create a dashed material
        var lineMaterial = new THREE.LineDashedMaterial({
            color: 0xffffff,
            linewidth: 1,
            dashSize: 0.2,
            gapSize: 0.1
        });

        // Create a line segments object using the edges and the material
        var lineSegments = new THREE.LineSegments(edges, lineMaterial);
        lineSegments.computeLineDistances(); // This is important for dashed lines
        scene.add(lineSegments);

        load_objects();

        // renderer
        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( renderer.domElement );

        window.addEventListener( 'resize', onWindowResize, false );
    }

    function load_objects(){
        //inicializace loaderu
        loader = new THREE.TextureLoader();

        // generate_stars();

        var backgroundLoader = new THREE.TextureLoader();
        backgroundLoader.load('/cv07/assets/menu-background.png', function(texture) {
            scene.background = texture;
        });

        //načtení hracího pole
        loader.load(
            //texture
            'assets/football-bg.jpg',
            //funkce s načetení textury
            function ( texture ) {
                var steel_geometry = new THREE.BoxGeometry( 10, pground_size, 0.1 );
                var tex_material = new THREE.MeshBasicMaterial( {
                    map: texture
                } );

                var steel_mesh = new THREE.Mesh( steel_geometry, tex_material );
                steel.add( steel_mesh );

                steel.position.z = -0.1/2 - 0.51/2;

                render();

            },
            // Function called when download progresses
            function ( xhr ) {
                console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
            },
            // Function called when download errors
            function ( xhr ) {
                console.log( 'An error happened' );
            }
        );


        //načíst červeného hráče
        loader.load(
            'assets/soccer-net.jpg',
            function ( texture ) {
                var player_geometry = new THREE.BoxGeometry( player_thisckness, player_size, 0.51 );
                var tex_material = new THREE.MeshBasicMaterial( {
                    map: texture
                } );
                var player1_mesh = new THREE.Mesh(player_geometry, tex_material);
                player1.add( player1_mesh );

                render();
            },
            // Function called when download progresses
            function ( xhr ) {
                console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
            },
            // Function called when download errors
            function ( xhr ) {
                console.log( 'An error happened' );
            }
        );

        //načíst modrého hráče
        loader.load(
            'assets/blue.jpg',
            function ( texture ) {

                var player_geometry = new THREE.BoxGeometry( player_thisckness, player_size, 0.51 );
                var tex_material = new THREE.MeshBasicMaterial( {
                    map: texture
                } );
                var player2_mesh = new THREE.Mesh(player_geometry, tex_material);

                player2.add( player2_mesh );

                render();
            },
            // Function called when download progresses
            function ( xhr ) {
                console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
            },
            // Function called when download errors
            function ( xhr ) {
                console.log( 'An error happened' );
            }
        );

        //načtení míčku
        var loader = new THREE.TextureLoader();
        loader.load('/cv07/assets/football-ball.jpg', function(texture) {
            var ballGeometry = new THREE.SphereGeometry(ball_size, 100, 100);
            var ballMaterial = new THREE.MeshPhongMaterial({map: texture});

            var ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
            ball.add(ballMesh);
        });
    }

    function load_lights(){
        //přidání osvětlení
        var light1 = new THREE.DirectionalLight( 0x777777 );
        light1.position.set( 0, -3, 5 ).normalize();
        scene.add( light1 );

        var light2 = new THREE.DirectionalLight( 0x333333 );
        light2.position.set( -5, -3, 5 ).normalize();
        scene.add( light2 );

        var light3 = new THREE.DirectionalLight( 0x333333 );
        light3.position.set( 5, -3, 5 ).normalize();
        scene.add( light3 );

        var light4 = new THREE.DirectionalLight( 0x222222 );
        light4.position.set( -5, -5, 0 ).normalize();
        scene.add( light4 );

        var light5 = new THREE.DirectionalLight( 0x222222 );
        light5.position.set( 5, -5, 0 ).normalize();
        scene.add( light5 );
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
        controls.handleResize();
        render();
    }

    function animate() {
        //animace
        requestAnimationFrame( animate );

        border_colision();
        ball.position.y += speed_y;

        if (ball.position.x >= pground_size - ball_size/2 || ball.position.x <= -pground_size + ball_size/2) {

            update_score();

            if (score1 == max_score){
                game_over(1);
            }
            if (score2 == max_score){
                game_over(2);
            }
            change_direction();
            reset_position();
        }

        if (ball.position.x >= pground_size - ball_size/2 - 0.25 || ball.position.x <= -pground_size + ball_size/2 + 0.25) {
            play_smash_sound();
        }

        player_colision();

        //ovladadni hracu
        player1_control();

        if (player_count == 2)
            player2_control();

        if (player_count == 1)
            ai_controll();


        ball.position.x += speed_x;
        // Update position of camera
        controls.update();;
        // Render scene
        render();

        document.body.addEventListener("keydown", function (e) {
            keys[e.keyCode] = true;
        });
        document.body.addEventListener("keyup", function (e) {
            keys[e.keyCode] = false;
        });

    }

    function player1_control() {
        //ovládádní hráče 1
        if (keys[38]){
            if (player1.position.y + player_size/2 < pground_size/2)
                player1.position.y += 0.03;
        }
        if (keys[40]){
            if (player1.position.y - player_size/2 > -pground_size/2)
                player1.position.y -= 0.03;
        }
    }

    function player2_control() {
        //ovládání hráče 2
        if (keys[87]){
            if (player2.position.y + player_size/2 < pground_size/2)
                player2.position.y += 0.03;
        }
        if (keys[83]){
            if (player2.position.y - player_size/2 > -pground_size/2)
                player2.position.y -= 0.03;
        }
    }

    function ai_controll() {
        //chování ai protivníka
        if (diff != "hard"){
            if (ball.position.x >= 1) {
                if (diff == "easy")
                    ai_speed = 0;
            }
            if ((ball.position.x >= -0) && (ball.position.x < 1)) {
                if (diff == "easy")
                    ai_speed = 0.008;
                else
                    ai_speed = 0.012;
            }
            if ((ball.position.x >= -1) && (ball.position.x < 0)) {
                if (diff == "easy")
                    ai_speed = 0.012;
                else
                    ai_speed = 0.018;
            }
            if (ball.position.x < -1) {
                if (diff == "easy")
                    ai_speed = 0.018;
                else
                    ai_speed = 0.025;
            }
        }

        if (diff == "hard"){
            if (player2.position.y > ball.position.y)
                ai_up = false;
            if (player2.position.y < ball.position.y)
                ai_up = true;
        }
        else{
            if (player2.position.y +0.33 > ball.position.y)
                ai_up = false;
            if (player2.position.y -0.33 < ball.position.y)
                ai_up = true;
        }


        if (ai_up && (player2.position.y + player_size/2 < pground_size/2)){
            player2.position.y += ai_speed;
            ai_moving = 1;
        }
        else if (!ai_up && (player2.position.y - player_size/2 > -pground_size/2)){
            player2.position.y -= ai_speed;
            ai_moving = -1;
        }
        else ai_moving = 0;


    }

    function render() {
        renderer.render( scene, camera );
    }

    function reset_position() {
        //pauzová mezera, která dá lepší fekt gólu
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

    function border_colision() {
        //odrážení odshora a odspoda
        if (ball.position.y >= 2.5 - ball_size/2 || ball.position.y <= -2.5 + ball_size/2) {
            speed_y = -speed_y;
            play_boing_sound();
        };
    }

    function update_score() {
        if(ball.position.x < 0){
            score1++;
            document.getElementById('sc1').innerHTML = score1;
        }
        if(ball.position.x > 0) {
            score2++;
            document.getElementById('sc2').innerHTML = score2;
        }
    }

    function player_colision() {
        //odrážení od hráčů
        if (ball.position.x <= player2.position.x + ball_size/2 + player_thisckness/2
            && (!(ball.position.x < player2.position.x))
            && ball.position.y < player2.position.y + player_size/2 + ball_size/2
            && ball.position.y > player2.position.y - player_size/2 - ball_size/2) {
            play_boing_sound();
            speed_x = -speed_x;
            if (keys[87] && speed_y < max_speed) speed_y += speed_step;
            if (keys[83] && speed_y > min_speed) speed_y -= speed_step;
            if (diff != "easy")
            {
                if (ai_moving == 1 && speed_y < max_speed) speed_y += speed_step;
                if (ai_moving == -1 && speed_y > min_speed) speed_y -= speed_step;
            }
        }
        if (ball.position.x > player1.position.x - ball_size/2 - player_thisckness/2
            && (!(ball.position.x > player1.position.x))
            && ball.position.y < player1.position.y + player_size/2 + ball_size/2
            && ball.position.y > player1.position.y - player_size/2 - ball_size/2) {
            play_boing_sound();
            speed_x = -speed_x;
            if (keys[38]) speed_y += speed_step;
            if (keys[40]) speed_y -= speed_step;
        }
    }

    function change_direction(){
        //náhodná změna směru u nové hry
        speed_y = 0.02;
        rand = Math.random();
        if (rand < 0.5)
            speed_x = -speed_x;
        if (rand < 0.25 || rand >= 0.75)
            speed_y = -speed_y;
    }

    //načítání zvuků

    function play_smash_sound(){
        audioLoader.load( 'audio/smash.mp3',
            function( buffer ) {
                smash_sound.setBuffer( buffer );
                smash_sound.setLoop( false );
                smash_sound.setVolume( 0.3 );
                smash_sound.play();
            }
        );
    }

    function play_boing_sound(){
        audioLoader.load( 'audio/boing.mp3',
            function( buffer ) {
                boing_sound.setBuffer( buffer );
                boing_sound.setLoop( false );
                boing_sound.setVolume( 1.1 );
                boing_sound.play();
            }
        );
    }

    function play_boo_sound(){
        audioLoader.load( 'audio/boo.mp3',
            function( buffer ) {
                boo_sound.setBuffer( buffer );
                boo_sound.setLoop( false );
                boo_sound.setVolume( 0.7 );
                boo_sound.play();
            }
        );
    }

    function play_yay_sound(){
        audioLoader.load( 'audio/yay.mp3',
            function( buffer ) {
                yay_sound.setBuffer( buffer );
                yay_sound.setLoop( false );
                yay_sound.setVolume( 0.7 );
                yay_sound.play();
            }
        );
    }

    function play_main_theme(){
        audioLoader.load( 'audio/main_theme.mp3',
            function( buffer ) {
                music.setBuffer( buffer );
                music.setLoop( true );
                music.setVolume( 2 );
                music.play();
            }
        );
    }

    async function game_over(winner){
        //konec hry, jeden hráč vyhrál
        score1 = 0;
        score2 = 0;
        document.getElementById('sc1').innerHTML = score1;
        document.getElementById('sc2').innerHTML = score2;
        if (player_count == 2){
            document.getElementById('info').innerHTML = "Player "+winner+" wins!";
            if (winner == 2) document.getElementById('info').style.color = "blue";
            else document.getElementById('info').style.color = "red";
            play_yay_sound();
        }else{
            document.getElementById('info').style.color = "red";
            if (winner == 2) {
                play_boo_sound();
                document.getElementById('info').innerHTML = "Game over!";
            }
            else {
                document.getElementById('info').innerHTML = "You win!";
                play_yay_sound();
            }
        }
        setTimeout(function(){document.getElementById('info').innerHTML = " "}, 2500);
    }
};

