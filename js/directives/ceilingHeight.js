directives.directive("ceilingHeight", function(){
    return {
      restrict: "A",
      scope: {
        model: '=',
       //bindAttr: '='
      },
      link: function(scope, element, attrs, $window){

        var container, stats;
        var camera, scene, renderer, controls;
        var projector, plane, parent, floor, superParent, room;
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
        
        var wallHeight = CEILING_HEIGHT.MAX * GRID_SIZE;
        var scaleFactor;
        var first = true;

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
          controls.maxPolarAngle = (Math.PI/2 - 0.001); 
          controls.minDistance = 0;
          controls.maxDistance = 4000;

          scene = new THREE.Scene();

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

          room = constructRoom(currentRoom, currentRoom.polygon.edges, thickness, wallHeight, function(idx, currentLine){
            return gray;
          });

          parent = room.parent;
          objects = room.objects;
          floor = room.floor;
          superParent = room.superParent;

          scaleFactor = 1;//(width * 0.5)/(boundingDeltaZ > boundingDeltaX ? boundingDeltaZ : boundingDeltaX);
          
          //parent.scale.x = scaleFactor;
          //parent.scale.z = scaleFactor;
          //parent.scale.y = scaleFactor;
          parent.position.y = 0;
          
          scene.add(superParent);
          
          zoomObject(superParent, camera, controls);

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

        function reconstructRoom(newHeight, oldHeight) {
            if(first || newHeight != oldHeight){
                scene.remove(superParent);

                wallHeight = newHeight  * GRID_SIZE;

                room = constructRoom(currentRoom, currentRoom.polygon.edges, thickness, wallHeight, function(idx, currentLine){
                    return gray;
                });

                parent = room.parent;
                objects = room.objects;
                floor = room.floor;
                superParent = room.superParent;

                scaleFactor = 1;//(width * 0.5)/(boundingDeltaZ > boundingDeltaX ? boundingDeltaZ : boundingDeltaX);
                
                //parent.scale.x = scaleFactor;
                //parent.scale.z = scaleFactor;
                //parent.scale.y = scaleFactor;
                //parent.position.y -= (wallHeight * scaleFactor);
                parent.position.y = 0;

                scene.add(superParent);

                first = false;
            }
        }

        function animate() {

          requestAnimationFrame( animate );


          var delta = clock.getDelta();
          
          renderer.render( scene, camera );
          controls.update();
          
        }

        init();
        animate();

        scope.$watch('model', reconstructRoom);

      } //END LINK
      
    };//END RETURN

});//END DIRECTIVE
