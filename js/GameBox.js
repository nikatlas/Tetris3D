(function(exports){

	var LAYERHEIGHT = 1;
	var DOWNVECTOR = new THREE.Vector3(0,-1,0);
	var UPVECTOR = new THREE.Vector3(0,1,0);
	var PALLETE = [0x03B5AA, 0x0A1128, 0xF2F6D0, 0x5F464B, 0xFCD0A1 ];

	var basicMaterial = new THREE.MeshPhongMaterial({
        specular: 0x030303,
        color : 0x00ff00,
        alphaTest: 0.9,
        shininess: 50,
        side: THREE.DoubleSide
    });

	var basicGeometry = new THREE.BoxGeometry(1,1,1);

	function GameBox(sizex, sizey, sizez){
		this.size = new THREE.Vector3(sizex,sizey,sizez);
		this.layers = [];
		for(var i=0;i<sizey;i++){
			var nlayer = new Layer(sizex,sizez);
			nlayer.position.copy(new THREE.Vector3(0,i,0));
			this.layers.push(nlayer);
		}
		this.droppables = [];
		this.moveVector = new THREE.Vector3(0,-1,0);
		this.platform = new THREE.Object3D();
		this.platform.position.copy(new THREE.Vector3(-this.size.x/2,1.501,-this.size.z/2));
		this.layerNode = new THREE.Object3D();
		for(var i = 0 ; i < this.layers.length; i ++ )	
			this.layerNode.add(this.layers[i]);
		this.platform.add(this.layerNode);
		this.createFloor(0x0Af128);


		this.toBeFree = [];
	}

	GameBox.prototype.createFloor = function(color){
		var geometry = new THREE.BoxGeometry( this.size.x, 1, this.size.z);
        //var material = new THREE.MeshBasicMaterial( {color: color, side: THREE.DoubleSide, shading: THREE.FlatShading} );
        var material = new THREE.MeshPhongMaterial({
                specular: 0x030303,
                color : color,
                alphaTest: 0.9,
                shininess: 2,
                side: THREE.DoubleSide
            });
        var plane = new THREE.Mesh( geometry, material );
        plane.receiveShadow = true;
        plane.position.x += this.size.x/2 - 0.5;
        plane.position.z += this.size.z/2 - 0.5;
        plane.position.y -= 1.0;


        this.platform.add(plane);

        // Add top light
        var l = new THREE.DirectionalLight( 0xffffff, 0.55 );
        l.castShadow = true;
        l.shadowCameraRight     =  30;
        l.shadowCameraLeft     = -30;
        l.shadowCameraTop      =  30;
        l.shadowCameraBottom   = -30;
        l.shadow.mapSize.width = 1024;
        l.shadow.mapSize.height = 1024;
        l.position.copy(new THREE.Vector3( 0 , 50, 0));
        l.castShadow = true;
        this.platform.add(l);

	};
	
	GameBox.prototype.init = function(scene){
		scene.add(this.platform);
	};
	GameBox.prototype.progress = function() {
		this.free();
		this.checkLayers();
		for(var i = this.droppables.length-1 ; i >= 0  ; i-- )
			this.droppables[i].progress(DOWNVECTOR);
		for(var i = 0 ; i < this.droppables.length ; i ++ ){
			var geometry = this.droppables[i].getGeometry();
			var flag = false;
			for(var j=0; j < geometry.length; j ++)
				if(this.checkCollision(geometry[j]))flag = true;
			if(flag){
				this.moveVector.multiplyScalar(-1)
				this.droppables[i].progress(UPVECTOR);
				geometry = this.droppables[i].getGeometry();
				this.randomDrop();
			}
			for(var j=0; j < geometry.length; j ++)
				this.occupy(this.droppables[i].color, geometry[j], !flag);
			if(flag)
				this.droppables.splice( i, 1 );
		}
	};
	GameBox.prototype.randomDrop  = function(){
		var shape = new SHAPESARRAY[parseInt(Math.random()*SHAPESARRAY.length - 0.0000001)](PALLETE[parseInt(Math.random()*12345) % 5])
		this.drop(shape);
	};
	GameBox.prototype.checkLayers = function(){
		var flag = false;
		for(var i = this.layers.length-1; i >= 0; i --) {
			if(this.layers[i].isComplete()){
				flag = true;
				this.layers.splice(i,1);
				this.layers.push(new Layer(this.size.x,this.size.z));
			}
		}
		if(flag){
			this.layerNode.children.length = 0;
			for(var i = 0 ; i < this.layers.length && flag; i ++){
				this.layers[i].position.copy(new THREE.Vector3(0,i,0));
				this.layerNode.add(this.layers[i]);
			}
		}
	};

	GameBox.prototype.occupy = function(color, vec, temp){
		this.getQuanto(vec.x,vec.y,vec.z).occupy(color, temp);
		if(temp){
			this.toBeFree.push(vec);
		}
	}
	GameBox.prototype.drop = function(shape) {
		var rpos = new THREE.Vector3( parseInt(Math.random()*(this.size.x-4))+2 ,(this.layers.length-3) * LAYERHEIGHT , parseInt(Math.random()*(this.size.z-4))+2);
		shape.position.copy(rpos);
		this.droppables.push(shape);
	};
	GameBox.prototype.move = function(x,z) {
		var vec = new THREE.Vector3(x,0,z);
		var rvec = new THREE.Vector3(-x,0,-z);
		this.free();
		for(var i = this.droppables.length-1 ; i >= 0  ; i-- )
			this.droppables[i].progress(vec);
		for(var i = 0 ; i < this.droppables.length ; i ++ ){
			var geometry = this.droppables[i].getGeometry();
			var flag = false;
			for(var j=0; j < geometry.length; j ++)
				if(this.checkCollision(geometry[j]))flag = true;
			if(flag){
				this.droppables[i].progress(rvec);
				geometry = this.droppables[i].getGeometry();
			}
			for(var j=0; j < geometry.length; j ++)
				this.occupy(this.droppables[i].color, geometry[j], true);
		}
	};

	GameBox.prototype.free = function(){
		// free old
		for(var i = 0 ; i < this.toBeFree.length; i ++)
			this.getQuanto(this.toBeFree[i]).free();
		this.toBeFree = [];
	};

	GameBox.prototype.checkCollision = function(x,y,z){
		if(typeof x == "object"){z = x.z;y=x.y;x=x.x;}
		if(x<0 || y < 0 || z < 0)return true;
		if(x >= this.size.x || y >= this.size.y || z >= this.size.z)return true;
		return this.getQuanto(x,y,z).occupied;
	};
	GameBox.prototype.getQuanto = function(x,y,z){
		if(typeof x == "object"){z = x.z;y=x.y;x=x.x;}
		if(x<0 || y < 0 || z < 0)return true;
		if(x >= this.size.x || y >= this.size.y || z >= this.size.z)return true;
		return this.layers[y].points[x][z];
	};

	// GameBox.prototype.occupyLayer = function(x) {
	// 	for(var i = 0;i<this.size.x;i++)
	// 		this.layers[x].points[i][4].occupy(0x00ff00);
	// 	this.layers[x].points[5][4].free();
	// };

	// LAYER /////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////
	function Layer(x,y){
		THREE.Object3D.apply(this);

		this.points = [];
		for( var i = 0; i < x ; i ++){
			this.points[i] = [];
			for ( var j = 0; j < y ; j ++){
				this.points[i][j] = new Quanto();
				this.points[i][j].position.copy(new THREE.Vector3(i,0,j));
				this.add(this.points[i][j]);
			}
		}
	};
	Layer.prototype = Object.create(THREE.Object3D.prototype);
	Layer.prototype.constructor = Layer;
	
	Layer.prototype.isComplete = function(){
		for(var i = 0; i < this.points.length; i ++)
			for(var j = 0;j < this.points[i].length; j++)
				if(!this.points[i][j].occupied)return false;
		return true;
	}

	// Quanto /////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////
	function Quanto(){
		THREE.Object3D.apply(this);
		this.occupied = false;

	};
	Quanto.prototype = Object.create(THREE.Object3D.prototype);
	Quanto.prototype.constructor = Quanto;

	Quanto.prototype.occupy = function(color , temp){
		if(this.occupied)
			throw new Error("Quanto is already occupied!!!");
		if(!this.cube){
			var geometry = basicGeometry.clone();
			//var material = new THREE.MeshBasicMaterial( {color: color} );
			var material = basicMaterial.clone();
			this.cube = new THREE.Mesh( geometry, material );
			this.cube.castShadow = true;
			this.cube.receiveShadow = true;
		}
		this.cube.material.color.set(color);
		this.add( this.cube );
		this.occupied = true;
		if(temp)this.occupied = false;
	};
	Quanto.prototype.free = function(){
		this.children.length = 0;
		this.occupied = false;
	}
	Quanto.prototype.toBoxCoords = function(Layer){
		return this.position + Layer;
	}
	

	// Shape /////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////
	function Shape(color){
		THREE.Object3D.apply(this);
		this.position = new THREE.Vector3(0,0,0);
		this.array = [this.position.clone()]; // Array of positions specifying the shape
		this.color = color;
	};
	Shape.prototype = Object.create(THREE.Object3D.prototype);
	Shape.prototype.constructor = Shape;
	Shape.prototype.progress = function(moveVector){
		this.position.add(moveVector);
	};
	Shape.prototype.getGeometry = function(){
		var narr = [];
		for(var i=0;i<this.array.length;i++)
			narr[i] = this.array[i].clone().add(this.position);
		return narr;
	};


	////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////// 		SHAPES 			//////////////////////////////////////////

	function Cross(color){
		THREE.Shape.apply(this);
		this.position = new THREE.Vector3(0,0,0);
		this.array = [new THREE.Vector3(0,0,0), 
						new THREE.Vector3(1,0,0),
						new THREE.Vector3(0,1,0),
						new THREE.Vector3(0,0,1),
						new THREE.Vector3(0,0,-1),
						new THREE.Vector3(0,-1,0),
						new THREE.Vector3(-1,0,0)
						]; // Array of positions specifying the shape
		this.color = color;
	};
	Cross.prototype = Object.create(Shape.prototype);
	Cross.prototype.constructor = Cross;

	function Line(color){
		THREE.Shape.apply(this);
		this.position = new THREE.Vector3(0,0,0);
		this.array = [new THREE.Vector3(0,0,0), 
						new THREE.Vector3(1,0,0),
						new THREE.Vector3(2,0,0),
						new THREE.Vector3(-1,0,0),
						new THREE.Vector3(-2,0,0)
						]; // Array of positions specifying the shape
		this.color = color;
	};
	Line.prototype = Object.create(Shape.prototype);
	Line.prototype.constructor = Line;

	function Light(color){
		THREE.Shape.apply(this);
		this.position = new THREE.Vector3(0,0,0);
		this.array = [new THREE.Vector3(0,0,0), 
						new THREE.Vector3(1,0,0),
						new THREE.Vector3(1,0,1),
						new THREE.Vector3(0,0,-1)
						]; // Array of positions specifying the shape
		this.color = color;
	};
	Light.prototype = Object.create(Shape.prototype);
	Light.prototype.constructor = Light;

	function Corner(color){
		THREE.Shape.apply(this);
		this.position = new THREE.Vector3(0,0,0);
		this.array = [new THREE.Vector3(0,0,0), 
						new THREE.Vector3(0,0,1),
						new THREE.Vector3(-1,0,0)
						]; // Array of positions specifying the shape
		this.color = color;
	};
	Corner.prototype = Object.create(Shape.prototype);
	Corner.prototype.constructor = Corner;

	function Axis(color){
		THREE.Shape.apply(this);
		this.position = new THREE.Vector3(0,0,0);
		this.array = [new THREE.Vector3(0,0,0), 
						new THREE.Vector3(1,0,0),
						new THREE.Vector3(0,1,0),
						new THREE.Vector3(0,0,1)
						]; // Array of positions specifying the shape
		this.color = color;
	};
	Axis.prototype = Object.create(Shape.prototype);
	Axis.prototype.constructor = Axis;


	var SHAPESARRAY = [Line, Shape, Axis, Corner];
	exports.Shapes = {
		Cross : Cross,
		Line  : Line,
		Box   : Shape,
		Axis  : Axis,
		Corner: Corner
	};

	exports.GameBox = GameBox;
})(window);