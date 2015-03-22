directives.directive("wallDirection", function(){
    return {
      restrict: "A",
      link: function(scope, element, attrs, $window){

      	var container, stats;
        var camera, scene, renderer, controls;
        var projector, plane, parent, superParent;
        var lineMaterial;

        var mouse2D;
        var mouse3D;
        var raycaster;
        var theta = 45;
        var isShiftDown = false;
        var isCtrlDown = false;
        var target = new THREE.Vector3( 0, 200, 0 );
        var normalMatrix = new THREE.Matrix3();
        var objects = [];
        var clock = new THREE.Clock();
        var document = window.document;
        var mainObj;
        var width, height;
        var offsetTop;
        var offsetLeft;
        
        var lineHeight = 200;
        var doneAnimate = false;
        
        var wallHeight = currentRoom.ceilingHeight * GRID_SIZE;
        var scaleFactor;

        var tetha = 0;
        var compass;
        var initialTetha;

        var currentExternal = currentRoom.currentExternal;
        var currentIdx = currentRoom.externalWallsIndexes[0];
        var currLine = currentRoom.polygon.edges[currentIdx];

        function rotateLeft(){
            tetha = (tetha+1 + 8) % 8;
            superParent.rotation.y = initialTetha + (tetha*ONE_FOURTH_PI);
            compass.attr('data-direction', tetha);
            currLine.direction = tetha;
        }

        function rotateRight(){
           tetha = (tetha-1 + 8) % 8;
            superParent.rotation.y = initialTetha + (tetha*ONE_FOURTH_PI);
            compass.attr('data-direction', tetha);
            currLine.direction = tetha;
        }

        function init() {
        
          mainObj = $(element[0]);
          compass = $(".compass");

          container = document.createElement( 'div' );
          mainObj.append( container );
          
          width = mainObj.width();
          height = mainObj.height();
          offsetTop = mainObj.offset().top;
          offsetLeft = mainObj.offset().left;

          camera = new THREE.PerspectiveCamera( 40, width / height, 1, 6000 );
          camera.position.y = 2000;
          camera.position.z = 800;

          controls = new THREE.OrbitControls( camera, element[0] );
          //controls.addEventListener( 'change', render );
          controls.maxPolarAngle = (Math.PI/2 - 0.001); 
          controls.minDistance = 0;
          controls.maxDistance = 4000;
          controls.noRotate = true;

          scene = new THREE.Scene();

          compass.attr('data-direction', currLine.direction);

          // Tetha
          initialTetha = (currentRoom.isClockwise ? (Math.PI + currLine.tetha) : currLine.tetha );
          tetha = currLine.direction;

          // Plane

          // Grid

          projector = new THREE.Projector();
          mouse2D = new THREE.Vector3( 0, 10000, 0.5 );

          // Lights
          var ambientLight = new THREE.AmbientLight( 0x777777 );
          scene.add( ambientLight );

          var directionalLight = new THREE.DirectionalLight( 0xffffff );
          directionalLight.position.x = -0.3704497358455519;
          directionalLight.position.y = 0.8303481835923215;
          directionalLight.position.z = -0.4162798184117182;
          directionalLight.position.normalize();
          directionalLight.castShadow = true;
          directionalLight.shadowDarkness = 0.1;
          scene.add( directionalLight );

          var directionalLight = new THREE.DirectionalLight( 0x808080 );
          directionalLight.position.x = 0.4314326373398046;
          directionalLight.position.y = 0.6372289487054973;
          directionalLight.position.z = 0.6385962310957584;
          directionalLight.position.normalize();
          directionalLight.castShadow = true;
          directionalLight.shadowDarkness = 0.1;
          scene.add( directionalLight );
          
          if(renderers.length == 0){
            renderers[0] = new THREE.WebGLRenderer({antialias:true, alpha: true});
          }
          
          renderer = renderers[0];
          renderer.setClearColor( 0x000000, 0 );
          renderer.setSize( width, height );

          // to antialias the shadow
          renderer.shadowMapType = THREE.PCFSoftShadowMap;
          container.appendChild(renderer.domElement);
          
          //construct!
          var room = constructRoom(currentRoom, currentRoom.polygon.edges, thickness, wallHeight, function(idx, currentLine){
            return idx == currentIdx ? blue : gray;
          });

          parent = room.parent;
          objects = room.objects;
          superParent = room.superParent;

          scaleFactor = 1;//(width * 0.5)/(boundingDeltaZ > boundingDeltaX ? boundingDeltaZ : boundingDeltaX);
          
          zoomObject(superParent, camera, controls);

          superParent.rotation.y = initialTetha + (tetha*ONE_FOURTH_PI);
          parent.position.y = 0;
          
          scene.add(superParent);

          var hammertime = new Hammer(element[0]);
    		  hammertime.on('swipeleft',rotateLeft).on('swiperight', rotateRight);

          $(".rotate-left").off("click").on("click", rotateLeft);
          $(".rotate-right").off("click").on("click", rotateRight);
        }

        function onWindowResize() {

          width = mainObj.width();
          width = width/GRID_SIZE * GRID_SIZE;
          mainObj.width(width);
          
          height = mainObj.height();
          camera.aspect = width / height;
          camera.updateProjectionMatrix();

          renderer.setSize( width, height );

        }

        function animate() {
          requestAnimationFrame( animate );

          var delta = clock.getDelta();
          
          if(!doneAnimate){
            parent.position.y += (delta*150);
            if(parent.position.y >= 0){
              parent.position.y = 0;
              doneAnimate = true;
            }
          }

          renderer.render( scene, camera );
          controls.update();
        }

        init();
        animate();

//        animate();

      } //END LINK
      
    };//END RETURN

});//END DIRECTIVE
