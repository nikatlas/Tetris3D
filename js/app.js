// nikatlas -- Solar System
(function() {
    var MAX_CAM = 300;
    var controls;
    var manager;
    var loader;
    var _textures = {};

    var Game = window.GameInstance =  new window.Game();
    var GameBox = new window.GameBox(8,15,8);

    var moveVector = new THREE.Vector2(0,0);
    function init() {
        Game.init();
        
        addLights(Game.scene);
        
        window.scene = Game.scene; // DEBUG

        manager = new THREE.LoadingManager();
        loader = new THREE.TextureLoader(manager);
        
        createScene(Game.scene);

        // controls
        controls = new THREE.OrbitControls(Game.camera, Game.renderer.domElement);
        controls.maxPolarAngle = Math.PI * 0.75;
        controls.minDistance = 1;
        controls.maxDistance = MAX_CAM;

        GameBox.init(Game.scene);
        GameBox.drop(new window.Shapes.Box(0x00ff20));
        

        Game.animate();
        var lasttime = 0,movelasttime=0;
        Game.addLoopFn(function(time){
            if(time - lasttime > 0.5  ){ ////////////////////////////////////////////////      TIME     .....
                GameBox.progress();
                lasttime = time;
            }
            if(time - movelasttime > 0.05){
                if(moveVector.x != 0 || moveVector.y != 0){
                    GameBox.move(moveVector.x,moveVector.y);
                    movelasttime = time;
                }
            }
        });

    }



    // Create Scene
    function createScene(scene){
        box = createBox(5,5,5,0x00ff20);
        box.receiveShadow = true;
        box.castShadow = true;
        box.position.copy(new THREE.Vector3( -4 , 7 , 4 ));
        //console.log(box.position);
        //scene.add(box);
        box = createBox(4,1,4,0x00ff20);
        box.receiveShadow = true;
        box.castShadow = true;
        box.position.copy(new THREE.Vector3( 1 , 4 , 0 ));
        //console.log(box.position);
        //scene.add(box);

        plane = createPlane(125,125,0xf00f2f);
        plane.rotation.x = Math.PI / 2;
        plane.receiveShadow  = true;
        scene.add(plane);

        target = scene;
        createSkybox(scene);
    }



    // Lights
    function createDLight(color, intensity) {
        var l = new THREE.DirectionalLight( color, intensity );
        l.castShadow = true;
        l.shadowCameraRight     =  30;
        l.shadowCameraLeft     = -30;
        l.shadowCameraTop      =  30;
        l.shadowCameraBottom   = -30;
        l.shadow.mapSize.width = 1024;
        l.shadow.mapSize.height = 1024;
        l.shadow.map = null;
        return l;
    }
    function addLights(scene) {
        scene.add(new THREE.AmbientLight(0x111111)); // Ambient light

        // White directional light at half intensity shining from the top.
        var directionalLight = createDLight( 0xffffff, 0.55 );
        directionalLight.position.copy(new THREE.Vector3( 0 , 50, 0));
        directionalLight.castShadow = true;
        // var directionalLight2 = createDLight( 0xffffff, 0.15 );
        // directionalLight2.position.copy(new THREE.Vector3( -100 , 100, -45 ));
        // directionalLight2.castShadow = true;
        // var directionalLight3 = createDLight( 0xffffff, 0.15 );
        // directionalLight3.position.copy(new THREE.Vector3( 0 , 100 , 65 ));
        // directionalLight3.castShadow = true;

        //scene.add( directionalLight );
        // scene.add( directionalLight2 );
        // scene.add( directionalLight3 );
    }

    function load(k,path) {
        _textures[k] = loader.load(path, THREE.SphericalRefractionMapping);
    }
    function loadTextures() {
        manager.onProgress = function () {
            console.log("Progress");
        }
        manager.onLoad = function(){
            console.log("[-] Textures Loaded!")
            computeGraph();
        }
        //load('sun','textures/planets/sun.jpg');
    }
    

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var earth,moon,sun,europa;
    function computeGraph() {
        return true;
    }
    // Input Handling
    var axis = 0;
    window.onkeydown = function (e) {
        if(e.keyCode == 65){ // a
            moveVector.x = -1;
        }
        else if(e.keyCode == 87){ // w
            moveVector.y = -1;
        }
        else if(e.keyCode == 68){ // d
            moveVector.x = 1;
        }
        else if(e.keyCode == 83){ // s
            moveVector.y = 1;
        }
        if(e.keyCode == 67){ // e
            startAnimations();
        }

        if(e.keyCode == 84){
            sun.showTrajectory(scene);
        }
        if(e.keyCode == 71){
            sun.hideTrajectory(scene);
        }

        console.log(e.keyCode);
    };
    window.onkeyup = function (e) {
        if(e.keyCode == 65){ // a
            moveVector.x = 0;
        }
        else if(e.keyCode == 87){ // w
            moveVector.y = 0;
        }
        else if(e.keyCode == 68){ // d
            moveVector.x = 0;
        }
        else if(e.keyCode == 83){ // s
            moveVector.y = 0;
        }
    };


    var raycaster = new THREE.Raycaster();
    var dragging = false;
    window.onmousedown = function (event) {
        // var mx = ( event.clientX / window.innerWidth ) * 2 - 1;
        // var my = - ( event.clientY / window.innerHeight ) * 2 + 1;
        // var mouse = new THREE.Vector2(mx,my);
        // // update the picking ray with the camera and mouse position
        // raycaster.setFromCamera( mouse, Game.camera );

        // // calculate objects intersecting the picking ray
        // var intersects = raycaster.intersectObjects( Game.scene.children, true );
        // if(intersects.length){
        //     dragging = intersects[0].object;
        // }
    };
    window.onmouseup = function (event) {
        dragging = false;
    };
    var lastmx=0,lastmy=0;
    window.onmousemove = function (event) {
        if(dragging){
            var mx = ( event.clientX / window.innerWidth ) * 2 - 1;
            var my = - ( event.clientY / window.innerHeight ) * 2 + 1;
            var dx = (mx - lastmx)*30;
            var dy = (my - lastmy)*30;
            lastmx = mx;
            lastmy = my;
            if(typeof dx != "number"  || typeof dy != "number" )return;
            switch(axis){
                case 1 :
                    dragging.position.x +=  dx;
                    break;
                case 2 : 
                    dragging.position.y +=  dy;
                    break;
                case 3 : 
                    dragging.position.z +=  dx;
                    break;
            }
        }

    };





















    ///////////////////////// HELPERS /////////////////////////////////

    function createSkybox(scene) {
        /////////////////////////////////////////////////////////////////////
        ///// SKYBOX
        var urlPrefix = "textures/skybox/mountain-skyboxes/Nalovardo/";
        var urls = [ "posx.jpg",  "negx.jpg",
            "posy.jpg",  "negy.jpg",
            "posz.jpg", "negz.jpg" ];
        scene.background = new THREE.CubeTextureLoader()
        .setPath( urlPrefix )
        .load(urls);
        return;
    
    }
    function createBox(x,y,z,color){
        //  This is where introtowebgl uses CubeGeometry
        var geometry = new THREE.BoxGeometry(x,y,z);

        //var material = new THREE.MeshBasicMaterial({ color: color, shading : THREE.SmoothShading });
        var material = new THREE.MeshPhongMaterial( { 
            color: color, 
            specular: 0x050505,
            shininess: 100
        } );
        var cube = new THREE.Mesh(geometry,material);
        return cube;
    }
    function createPlane(w,h,color,ws,hs){
        if(ws == undefined)ws=1;
        if(hs == undefined)hs=1;

        var geometry = new THREE.PlaneGeometry( w, h, ws,hs );
        //var material = new THREE.MeshBasicMaterial( {color: color, side: THREE.DoubleSide} );
        var material = new THREE.MeshPhongMaterial({
                specular: 0x030303,
                color : color,
                alphaTest: 0.8,
                shininess: 2,
                side: THREE.DoubleSide
            });
        var plane = new THREE.Mesh( geometry, material );
        return plane;
    }


    init();
})();


