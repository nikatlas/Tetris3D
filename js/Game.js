(function(){
		function Game(){
			this._loopfns = [];
			this.animating = true;
			this.animateable = [];
			this._ctime = 0; 
		}
		Game.prototype.init = function() {
			this.container = document.createElement('div');
	        document.body.appendChild(this.container);
	        this.scene = new THREE.Scene();
	        this.camera = this._createCamera();
	        
	        this.scene.add(this.camera);

	        // renderer
	        this.renderer = new THREE.WebGLRenderer({antialias: true});
	        this.renderer.setPixelRatio(window.devicePixelRatio);
	        this.renderer.setSize(window.innerWidth, window.innerHeight);
	        this.renderer.setClearColor(new THREE.Color( 0x0aa000 ));

	        this.container.appendChild(this.renderer.domElement);
	        this.renderer.gammaInput = true;
	        this.renderer.gammaOutput = true;
	        this.renderer.shadowMap.enabled = true;
	        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // other THREE. PCFShadowMap
	        
			var self = this;
	        window.addEventListener('resize', function(){onWindowResize(self)}, false);
		};
		function onWindowResize(self){
			self.camera.aspect = window.innerWidth / window.innerHeight;
	        self.camera.updateProjectionMatrix();
	        self.renderer.setSize(window.innerWidth, window.innerHeight);
		};

		Game.prototype._createCamera = function(){
			var camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 100000);
	        camera.position.x = 10;
	        camera.position.y = 10;
	        camera.position.z = 50;
	        return camera;
		};
		var kk = 0; 
		var frameRate = [];
		Game.prototype.animate = function(time){
	        this._time = time/1000.0;
	        var dt;
	        if(this._frame){
	            dt = this._time - this._frame;
	            this._ctime += dt;
	            this._frame = this._time;
	        }
	        else this._frame = this._time;
	        frameRate[kk] = dt;
	        kk = (kk+1) % 60;
	        // Custom timing
	        this.render(this._ctime);
	        this._lastReq = requestAnimationFrame(this.animate.bind(this));
	    };
	    Game.prototype.showFramerate = function(){
	    	var s = 0;
	    	for(var i =0 ;i < frameRate.length;i++)
	    		s+=frameRate[i];
	    	console.log(s/frameRate.length);
	    }

	    Game.prototype.render = function(time) {
	        if(this.animating)
	            for(var i in this.animateable)
	                this.animateable[i].animate(this._time);

	        for(var i = 0; i < this._loopfns.length; i ++ )
	        	this._loopfns[i].call(this, this._time);

	        //this.scene.updateMatrixWorld();
	        this.renderer.render(this.scene, this.camera);
	    };

	    Game.prototype.addActor = function(a){
	    	this._animateable.push(a);
	    };
	    Game.prototype.addLoopFn = function(fn){
	    	this._loopfns.push(fn);
	    };
	    Game.prototype.startAnimations = function(){this.animating = true;this.frame = window.performance.now()/1000.0;};
	    Game.prototype.stopAnimations = function(){this.animating = false;this.frame = null;};


window.Game = Game;
})();