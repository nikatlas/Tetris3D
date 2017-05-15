/**
 * Created by nikatlas on 3/20/2017.
 */
(function () {
    var PI2 = 2 * Math.PI;
    var SLOWDOWN = 1/1;

    var normalFunction = function (t) {
        return new THREE.Vector3(
            this._distance * Math.sin( PI2* this._pfreq * t + this.phase),
            0,
            this._distance * Math.cos( PI2 * this._pfreq * t + this.phase) );
    }
    function Planet(radius, sfreq, pfreq, distance,texture, light) {

        radius = 0.0005 * radius; // Adjust values so that we have a nice effect...
        distance = 1.1 * distance;
        sfreq = 10*sfreq * SLOWDOWN;
        pfreq = 100 *pfreq * SLOWDOWN;
        ///////////////////////////////////


        ///////////////////////////////////


        this._customfn = normalFunction;
        this._debug = null;
        this._distance = distance;
        this._pfreq    = pfreq;
        this._sfreq    = sfreq;
        this._radius   = radius;
        this._texture  = texture;
        this._entity   = null;
        this._children = [];
        this.phase     = Math.random()*5;
        this._light    = light;

        var ballGeo = new THREE.SphereGeometry( this._radius, 100, 100);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = 16;

        this._entity = new THREE.Object3D();

        if(light){
            this._uniforms = {
                texture: { value: texture }
            };
            var material = new THREE.ShaderMaterial( {
                uniforms: this._uniforms,
                vertexShader: document.getElementById( 'vertexShaderDepth' ).textContent,
                fragmentShader: document.getElementById( 'fragmentShaderDepth' ).textContent
            } );
            this._mesh   = new THREE.Mesh(ballGeo, material);
            this._mesh.userData = {planet : true};
            this._mesh.name = "PlanetaMeshAstro" + Math.random();
            this._material = material;

            var pointLight = new THREE.PointLight( 0xffffff, 2  , 10000 , 2 );
            pointLight.castShadow = true;
            //Set up shadow properties for the light
            pointLight.shadow.mapSize.width = 2048;  // default
            pointLight.shadow.mapSize.height = 2048; // default
            pointLight.shadow.camera.near = 1;       // default
            pointLight.shadow.camera.far = 1000;     // default
            pointLight.position.set(0,0,0);

            this._mesh.castShadow = false;
            this._mesh.receiveShadow = false;
            this._entity.add( pointLight );
        }
        else {  // Changing the vertex shader here we could move the position/rotation computation to GPU
            var material = new THREE.MeshPhongMaterial({
                specular: 0x030303,
                map: texture,
                alphaTest: 0.8,
                shininess: 2,
                side: THREE.FrontSide
            });
            this._mesh   = new THREE.Mesh(ballGeo, material);
            this._mesh.userData = {planet : true};
            this._mesh.name = "PlanetaMesh" + Math.random();

            this._material = material;
            this._mesh.castShadow = true;
            this._mesh.receiveShadow = true;
        }
        this._entity.add(this._mesh);
    }

    Planet.prototype.add = function (p) {
        this._children.push(p);
    };
    Planet.prototype.animate = function (t) {
        for(var i in this._children){
            this._children[i].animate(t);
        }
        this._animate(t);
    };
    Planet.prototype.setCustomFunction = function (fn) {
        this._customfn = fn; // no error handling sry
    };
    Planet.prototype._animate = function (t) {
        var vector;
        if( this._customfn )
            vector = this._customfn(t);
        else return;
        this._entity.position.copy(vector);
        this._mesh.rotation.y = PI2 * this._sfreq * t ;
    };
    Planet.prototype.setFrequency = function (f) {
        this._freq = f;
    };
    Planet.prototype.addToScene  = function (scene) {
        for(var i in this._children){
            this._children[i].addToScene(this._entity);
        }
        scene.add(this._entity);
    };
    Planet.prototype.createTrajectory = function () {
        var fn = normalFunction;
        if(this._customfn){
            fn = this._customfn;
        }


        var material = new THREE.LineBasicMaterial({ color: 0x0000ff });var geometry = new THREE.Geometry();
        for( var i = 0 ; i < 5000 ; i ++ ){
            geometry.vertices.push(fn.call(this, i/500));
        }

        this._debug = new THREE.Line(geometry,material);
    };
    Planet.prototype.showTrajectory = function (scene) {
        this.createTrajectory();
        for (var i in this._children) {
            this._children[i].showTrajectory(this._entity);
        }
        if (this._distance)
            scene.add(this._debug);
    };
    Planet.prototype.hideTrajectory = function (scene) {
        for(var i in this._children){
            this._children[i].hideTrajectory(this._entity);
        }
        scene.remove(this._debug);
    };

    window.Planet =  Planet;
})();