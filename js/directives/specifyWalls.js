directives.directive("specifyWalls", function(){
    return {
      restrict: "A",
      link: function(scope, element, attrs, $window){

        var container, stats;
        var camera, scene, renderer, controls;
        var projector, plane, parent, floor, superParent;
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

        function toDegree(radian){
        
          return (radian/(2*Math.PI)) * 360;
        
        }

        function init() {
        
          mainObj = $(element[0]);
          container = document.createElement( 'div' );
          mainObj.append( container );
          
          width = mainObj.width();
          height = mainObj.height();
          offsetTop = mainObj.offset().top;
          offsetLeft = mainObj.offset().left;

          camera = new THREE.PerspectiveCamera( 45, width / height, 1, 6000 );
          camera.position.y = 800;
          camera.position.z = 1500;

          controls = new THREE.OrbitControls( camera, element[0] );
          //controls.addEventListener( 'change', render );
          controls.maxPolarAngle = (Math.PI/2 - 0.001); 
          controls.minDistance = 0;
          controls.maxDistance = 4000;

          scene = new THREE.Scene();

          // Plane

          //var geometry = new THREE.PlaneGeometry( 100000, 100000 );
          //var material = new THREE.MeshBasicMaterial( {color: 0xdddddd, side: THREE.DoubleSide} );
          //plane = new THREE.Mesh( geometry, material );
          //plane.rotation.x = Math.PI/2;
          //scene.add( plane );

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
          scene.add( directionalLight );

          var directionalLight = new THREE.DirectionalLight( 0x808080 );
          directionalLight.position.x = 0.4314326373398046;
          directionalLight.position.y = 0.6372289487054973;
          directionalLight.position.z = 0.6385962310957584;
          directionalLight.position.normalize();
          scene.add( directionalLight );
          
          if(renderers.length == 0){
            renderers[0] = new THREE.WebGLRenderer({antialias:true, alpha: true});
          }
          
          renderer = renderers[0];
          renderer.setClearColor( 0x000000, 0 );
          renderer.setSize( width, height );
          container.appendChild(renderer.domElement);

          //construct!

          var room = constructRoom(currentRoom, currentRoom.polygon.edges, thickness, wallHeight, function(idx, currentLine){
            return currentLine.external ? blue : gray;
          });

          parent = room.parent;
          objects = room.objects;
          floor = room.floor;
          superParent = room.superParent;

          scaleFactor = 1;//(width * 0.5)/(boundingDeltaZ > boundingDeltaX ? boundingDeltaZ : boundingDeltaX);
          
          //parent.scale.x = scaleFactor;
          //parent.scale.z = scaleFactor;
          //parent.scale.y = scaleFactor;
          
          scene.add(superParent);
          
          zoomObject(superParent, camera, controls);

          parent.position.y -= (wallHeight * scaleFactor);
          
          $(mainObj).on('click', onDocumentMouseDown);

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

        function onDocumentMouseMove( e ) {

          e.preventDefault();

        }

        function onDocumentMouseDown( e ) {

          e.preventDefault();

          mouse2D.x = ( (event.clientX - offsetLeft) / width ) * 2 - 1;
          mouse2D.y = - ( (event.clientY - offsetTop) / height ) * 2 + 1;

          raycaster = projector.pickingRay( mouse2D.clone(), camera );

          var intersects = raycaster.intersectObjects( objects );

          if ( intersects.length > 0 ) {

            var intersect = intersects[ 0 ].object;
            var idx = intersect.idx;
            var room = currentRoom.polygon.edges[idx];
            room.external = !room.external;

            intersect.material.color = room.external ? blue : gray;
            currentRoom.noOfExternal += room.external ? 1 : -1;

            saveToSessionStorage();

          }
        
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

      } //END LINK
      
    };//END RETURN

});//END DIRECTIVE
