'use strict';
 
/* Directives */
var directives = angular.module('myApp.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]);


directives.directive("aRoom", function(){
  return {
    restrict: "A",
    link: function(scope, element, attrs, $window){



   	}
 }
});



//TODO redo the 3d part

directives.directive("addWindows", function(){
  return {
    restrict: "A",
    scope: {notifyDone : '&' },
    link: function(scope, element, attrs, $window){
       
      var mainObj = $('.main-canvas',element[0]);
      var undoStack = [];
      var redoStack = [];
      var windows = [];
      var isDragging = false;
 
      var width = mainObj.width();
      var height = mainObj.height();
      var offsetTop = mainObj.offset().top;
      var offsetLeft = mainObj.offset().left;
      //var scene, camera, controls, projector, mouse2D, parent, objects, renderer;
      var room;
      var roomView = $(".room-view", element[0]);
      var clock = new THREE.Clock();
      var doneAnimate = false;
      var _2DscaleFactor;
      var _3DscaleFactor;
      var _3DwallHeight = currentRoom.ceilingHeight * GRID_SIZE;
      var minWidth = 3*GRID_SIZE;
      var minHeight = 3*GRID_SIZE;
      var done = false;
      var expandedPoints;
      var normalPoints;

      //3d VIEW END
      var undo = $(".undo");
      var redo = $(".redo");
      var clear = $(".clear");
      var next = $(".next");
      var duplicate = $(".duplicate");
      var remove = $(".remove");
 
      var isDown = false;
 
      var wallWidth, _2DwallHeight;
      var currentExternal = currentRoom.currentExternal;
      var currentIdx = currentRoom.externalWallsIndexes[currentExternal];
      var top;
      var left;
      var deltaTop;
      var deltaLeft;
      var currWall;
      var actualWallWidth;
      var actualWallHeight;

      var currLine = currentRoom.polygon.edges[currentIdx];
      
      function selectTarget(target){
          if(target.hasClass("drag-start")){
          target.removeClass("drag-start");
        } else{
          if(target.hasClass("active")){
            target.removeClass("active");
            duplicate.prop("disabled", true);
            remove.prop("disabled", true);
            return;
          }
          $(".wall-window.active").removeClass("active");
          target.addClass("active");
          duplicate.prop("disabled", false);
          remove.prop("disabled", false);
        }
      }

      function addWindow(top, left, height, width, relativeHeight, relativeWidth){
        
        var wallWindow = $("<div class='wall-window' data-id='"+windows.length+"'><div class='window-bg-wrapper'></div><div class='window-width-wrapper'><span class='window-width'></span> m</div><div class='window-height-wrapper'><span class='window-height'></span> m</div></div></div>");
 
        wallWindow.appendTo(windowsContainer);
        windows.push(wallWindow);
        
        $('.window-height',wallWindow).text(height * 1);
        $('.window-width',wallWindow).text(width * 1);

        var resizeGridWidth = relativeWidth / (width/0.1) ;
        var resizeGridHeight = relativeHeight / (height/0.1) ;
         
        wallWindow.css({
          top: top + "px",
          left: left + "px",
          width: relativeWidth + "px",
          height: relativeHeight + "px"
        }).click(function(e){
          selectTarget($(e.currentTarget));
        }).draggable({
          snap: ".wall-window",
          grid: [resizeGridWidth, resizeGridHeight],
          containment: windowsContainer,
          start: function( e, ui ) {
            logEvent();
            $(this).addClass("drag-start");
          },
          drag: onMove,
          stop: function( e, ui) {
            //$(e.target).removeClass("active");
          }
        }).resizable({
          grid: [resizeGridWidth, resizeGridHeight],
          containment: windowsContainer,
          handles: "all",
          start: function( e, ui ) {
            logEvent();
          },
          resize: onResize,
          stop: function(e, ui){
            //$(e.target).removeClass("active");
          }
        });
      }

      function clearFunction(){
        $(".clear").prop("disabled", true);
        $(".undo").prop("disabled", true);
        $(".redo").prop("disabled", true);
        undoStack = [];
        redoStack = [];
        windowsContainer.empty();
        windows = [];
        constructWall();
      }

      function populateWindows(windowsStack){

        windowsContainer.empty();
        windows = [];
        for(var i=0; i < windowsStack.length; ++i){
          addWindow(windowsStack[i].top, windowsStack[i].left, (windowsStack[i].height/GRID_SIZE).toFixed(1), (windowsStack[i].width/GRID_SIZE).toFixed(1), windowsStack[i].relativeHeight, windowsStack[i].relativeWidth);
        }
        constructWall();

      }

      function redoFunction(){
        if(redoStack.length == 0){
          return;
        }
        
        undoStack.push(angular.copy(currLine.windows));

        clear.prop("disabled", false);

        var windowsStack = redoStack.pop();
        populateWindows(windowsStack);
        
        done = false;
        
        if(redoStack.length == 0){
            redo.prop("disabled", true);
        }

        currLine.undoStack = undoStack;
      }

      function undoFunction(){
        if(undoStack.length == 0){
          return;
        }

        redoStack.push(angular.copy(currLine.windows));
        $(".redo").prop("disabled", false);
        
        var windowsStack = undoStack.pop();
        populateWindows(windowsStack);
        
        done = false;
        
        if(undoStack.length == 0){
            undo.prop("disabled", true);
            clear.prop("disabled", true);
        }

        currLine.undoStack = undoStack;
      }
 
      function animate() {
 
        requestAnimationFrame( animate );
        room.renderer.render( room.scene, room.camera );
        room.controls.update();

      }

      function getWidth(width, containerWidth, actualWidth){
        return ((width/_2DscaleFactor) / GRID_SIZE).toFixed(1);//(width/containerWidth * actualWidth).toFixed(1);
      }

      function getHeight(height, containerHeight, actualHeight){
        return ((height/_2DscaleFactor)/ GRID_SIZE).toFixed(1);
      }

      function constructWall(){
        
        var startPoint = getPointIdx(currLine.start.id, currentRoom.polygon.vertices);
        var endPoint = getPointIdx(currLine.end.id, currentRoom.polygon.vertices);
        
        currWall.geometry.computeFaceNormals();
        currWall.geometry.computeVertexNormals();

        var subtract_bsp = new ThreeBSP(currWall);
         
        var _3DscaleFactor = 1;
        var x1 = _3DscaleFactor * expandedPoints[startPoint].x,
            y1 = _3DscaleFactor * 0,
            z1 = _3DscaleFactor * expandedPoints[startPoint].y,
             
            x2 = _3DscaleFactor * expandedPoints[endPoint].x,
            y2 = _3DscaleFactor * 0,
            z2 = _3DscaleFactor * expandedPoints[endPoint].y,
 
            x3 = _3DscaleFactor * expandedPoints[startPoint].x,
            y3 = _3DscaleFactor * _3DwallHeight,
            z3 = _3DscaleFactor * expandedPoints[startPoint].y;
 
        var tetha = Math.atan((normalPoints[endPoint].y-normalPoints[startPoint].y)/(normalPoints[endPoint].x-normalPoints[startPoint].x));
        
        var right = new THREE.Vector3(1, 0, 0);
        var wallDirection = (new THREE.Vector3(normalPoints[endPoint].x, y2, normalPoints[endPoint].y).sub(new THREE.Vector3(normalPoints[startPoint].x, y1, normalPoints[startPoint].y))).normalize();
        var quaternion = new THREE.Quaternion().setFromUnitVectors(right, wallDirection);
        
        var rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion( quaternion );
        var overlapping = false;
        
        currWallParent.children = [];
        currLine.windows = [];
         
        for(var i=0; i < windows.length; ++i){
          
          var position = windows[i].position();
          var left = position.left;
          var top = position.top;
          var scaledWidth = windows[i].outerWidth();
          var scaledHeight = windows[i].outerHeight();
          var width = scaledWidth/_2DscaleFactor;
          var height = scaledHeight/_2DscaleFactor;
          var area = (getWidth(width) * getHeight(height)).toFixed(1);
          var currOverlapping = false;

          for(var j=0; j < windows.length; ++j){

            if(i==j) continue;
            
            var windowPos = windows[j].position();
            var windowX1 = windowPos.left;
            var windowX2 = windowX1 + windows[j].outerWidth();
            var windowY1 = windowPos.top;
            var windowY2 = windowY1 + windows[j].outerHeight();

            //collision detection
            if (left < windowX2 && left+scaledWidth > windowX1 &&
              top < windowY2 && top+scaledHeight > windowY1){
              overlapping = true;
              currOverlapping = true;
              break;
            }

          }

          windows[i].toggleClass("overlapping", currOverlapping);

          // compute vector from point 1 to point 2
          var p1p2x = x2 - x1;
          var p1p2y = y2 - y1;
          var p1p2z = z2 - z1;
 
          // compute vector from point 1 to point 3
          var p1p3x = x3 - x1;
          var p1p3y = y3 - y1;
          var p1p3z = z3 - z1;
 
          var leftPos = (left + scaledWidth/2)/innerWallWidth;
          var topPos = 1-(top/innerWallHeight);
           
          var v3x1 = x1 + (leftPos * p1p2x +  topPos * p1p3x);
          var v3y1 = y1 + (leftPos * p1p2y +  topPos * p1p3y);
          var v3z1 = z1 + (leftPos * p1p2z +  topPos * p1p3z);
          var wallThickness = thickness*1.2;
 
          var boxGeo = new THREE.BoxGeometry(width, height, wallThickness);
          var windowMaterial = new THREE.MeshNormalMaterial( { transparent: true, opacity: 0.1 } );
          windowMaterial.side = THREE.DoubleSide;

          v3y1 -= height/2;
           
          var matrix = new THREE.Matrix4().makeRotationFromQuaternion( quaternion );
          
          var windowMesh = new THREE.Mesh(boxGeo, windowMaterial);
          windowMesh.overdraw = true;
          windowMesh.applyMatrix(matrix);
          windowMesh.position.set(v3x1, v3y1, v3z1);
          
          var window_bsp = new ThreeBSP( windowMesh );
          window_bsp = window_bsp.intersect(subtract_bsp);

          subtract_bsp = subtract_bsp.subtract( window_bsp );

          //windowMesh = window_bsp.toMesh( windowMaterial );
          //windowMesh.geometry.computeVertexNormals();
          
          currWallParent.add(windowMesh);

          currLine.windows.push({
            width: width,
            height: height,
            top: top,
            left: left,
            relativeWidth: scaledWidth,
            relativeHeight: scaledHeight,
            area: area,
            thickness: wallThickness,
            x: v3x1,
            y: v3y1,
            z: v3z1,
            rotationMatrix: matrix
          });
        }

        next.prop("disabled", overlapping);

        var material = new THREE.MeshLambertMaterial({ shading: THREE.FlatShading, color: blue });
        material.side = THREE.DoubleSide;
 
        var wallResult = subtract_bsp.toMesh( material );
        wallResult.geometry.computeFaceNormals();
        wallResult.geometry.computeVertexNormals();
        //wallResult.geometry.computeVertexNormals();

        currWallParent.add(wallResult);
      
      } //END CONSTRUCT WALL

      function onMove( e ){
        
        //reconstruct wall
        constructWall();

      }

      function logEvent( ) {
        
        redoStack = [];
        undoStack.push(angular.copy(currLine.windows));
        undo.prop("disabled", false);
        clear.prop("disabled", false);
        redo.prop("disabled", true);
        currLine.undoStack = undoStack;

      }

      function onResize( event, ui ){

        var self = $(this);
        var id = parseInt(self.attr("data-id"));

        var itemWidth = ui.size.width;
        var itemHeight = ui.size.height;
        var eventX = ui.position.left;
        var eventY = ui.position.top;
        
        /*
        if(itemWidth < minWidth){
          itemWidth = minWidth;
        } else if(eventX + itemWidth > innerWallWidth){
          itemWidth = innerWallWidth - eventX;
        }
 
        if(itemHeight < minHeight){
          itemHeight = minHeight;
        } else if(eventY + itemHeight > innerWallHeight){
          itemHeight = innerWallHeight - eventY;
        }*/

        /*
        var overlap = false;

        for(var i=0; i < windows.length; ++i){
          if(i == id) continue;
          var windowPos = windows[i].position();
          var windowX1 = windowPos.left;
          var windowX2 = windowX1 + windows[i].outerWidth();
          var windowY1 = windowPos.top;
          var windowY2 = windowY1 + windows[i].outerHeight();

          //collision detection
          if (eventX < windowX2 && eventX+itemWidth > windowX1 &&
            eventY < windowY2 && eventY+itemHeight > windowY1){
            overlap = true;
            break;
          }
        }

        if(overlap){
          itemWidth = ui.originalSize.width;
          itemHeight = ui.originalSize.height;
        }
 
        $(this).css({
          "width": itemWidth,
          "height": itemHeight
        });*/
          
          self.toggleClass('big-window', itemWidth > '90' && itemHeight > '90' );

        $('.window-height',self).text(getHeight(itemHeight, innerWallHeight, actualWallHeight) * 1);
        $('.window-width',self).text(getWidth(itemWidth, innerWallWidth, actualWallWidth) * 1);
        
        //reconstruct wall 
        constructWall();

      }
      
      var expandedPoly = expandPoly(currentRoom.polygon, thickness/2);
      normalPoints = currentRoom.polygon.vertices;
      expandedPoints = expandedPoly.vertices;
      
      if(renderers.length == 0){
        renderers[0] = new THREE.WebGLRenderer({antialias:true, alpha: true});
      }
      
      var renderer = renderers[0];

      room = init3DRoom(currentRoom, roomView,  function(idx, currentLine){
              return idx == currentIdx ? blue : gray;
          }, 1, true, renderer, function(idx, currentLine){
            return idx != currentIdx;
          }, 0.6);
      parent = room.parent;
      
      _3DscaleFactor = 1;//(width * 0.5)/(boundingDeltaZ > boundingDeltaX ? boundingDeltaZ : boundingDeltaX);
      
      animate();
       
      currWall = parent.children[currentIdx];
      parent.remove(currWall);
      
      var currWallParent = new THREE.Object3D();
      currWallParent.add(currWall);
      parent.add(currWallParent);
      
      actualWallWidth = currentRoom.polygon.edges[currentIdx].length;
      actualWallHeight = currentRoom.ceilingHeight;

      wallWidth = currentRoom.polygon.edges[currentIdx].length * GRID_SIZE;
      _2DwallHeight = currentRoom.ceilingHeight * GRID_SIZE;
 
      _2DscaleFactor = _2DwallHeight > wallWidth ? (height * 0.9) / _2DwallHeight : (width * 0.9) / wallWidth;
      
      if(_2DscaleFactor * _2DwallHeight > 0.9 * height){
        _2DscaleFactor = 0.9*height / _2DwallHeight;
      } // force to be max height

      wallWidth *= _2DscaleFactor;
      _2DwallHeight *= _2DscaleFactor;

      var innerWallWidth = wallWidth;
      var innerWallHeight = _2DwallHeight;
      var topLeftX = (width - innerWallWidth)/2;
      var topLeftY = (height - innerWallHeight)/2;

      var defaultWindowSize = wallWidth / actualWallWidth;
 
      var startX, startY, endX, endY;
       
      top = ((height-_2DwallHeight)/2);
      left = ((width-wallWidth)/2);
      deltaTop = topLeftY-top;
      deltaLeft = topLeftX-left;
 
      var mainWall = $('.main-wall', mainObj);
      mainWall.css({
        "left": left + "px",
        "top": top + "px",
        "width": wallWidth + "px",
        "height": _2DwallHeight + "px"
      });
 
      var windowsContainer = $(".windows-container", mainObj);
      windowsContainer.css({
        "left": 0,
        "right": 0,
        "top": 0,
        "bottom": 0,
        "position": "absolute"
      });
 
      $(mainWall).droppable({
        accept: ".window-img",
        activeClass: "ui-state-active",
        drop: function( e, ui ) {
          
          $(ui.draggable[0]).removeAttr("style");
          
          var touchMouseEvent = normalizeEvent(e);
          if(touchMouseEvent == null){
            return;
          }
           
          var eventX = (touchMouseEvent.pageX - offsetLeft - left);
          var eventY = (touchMouseEvent.pageY - offsetTop - top);

          var tempTop = eventY;
          var tempLeft = eventX;
          var tempHeight = defaultWindowSize;
          var tempWidth = defaultWindowSize;

          /*
          tempTop -= (tempHeight/2);
          tempLeft -= (tempWidth/2);

          if(tempTop < 0){
            tempTop = 0;
          }else if(tempTop + tempHeight > innerWallHeight){
            tempTop = innerWallHeight - tempHeight;
          }
 
          if(tempLeft < 0){
            tempLeft = 0;
          }else if(tempLeft + tempWidth > innerWallWidth){
            tempLeft = innerWallWidth - tempWidth;
          }*/

          /*for(var i=0; i < windows.length; ++i){
            var windowPos = windows[i].position();
            var windowX1 = windowPos.left;
            var windowX2 = windowX1 + windows[i].outerWidth();
            var windowY1 = windowPos.top;
            var windowY2 = windowY1 + windows[i].outerHeight();

            //collision detection
            if (tempLeft < windowX2 && tempLeft+tempWidth > windowX1 &&
              tempTop < windowY2 && tempTop+tempHeight > windowY1){
              return false;
            }
          }*/

          logEvent();

          addWindow(tempTop, tempLeft, getHeight(tempHeight, innerWallHeight, actualWallHeight), getWidth(tempWidth, innerWallWidth, actualWallWidth), tempHeight, tempWidth);

          constructWall();
        }
      }); //END DROP WINDOW

      function removeFunction(){
        logEvent();
        var windowId = parseInt($(".wall-window.active").attr("data-id"));
        windows[windowId].remove();
        windows.splice(windowId, 1);
        for(var i=0; i < windows.length; ++i){
          windows[i].attr("data-id", i);
        }
        constructWall();
        duplicate.prop("disabled", true);
        remove.prop("disabled", true);
      }

      function duplicateFunction(){
        logEvent();
        var windowId = parseInt($(".wall-window.active").attr("data-id"));
        var cloneWindow = windows[windowId];
        var position = cloneWindow.position();
        var height = cloneWindow.outerHeight();
        var width = cloneWindow.outerWidth();
        addWindow(position.top, position.left, getHeight(height, innerWallHeight, actualWallHeight), getWidth(width, innerWallWidth, actualWallWidth), height, width);
        
        constructWall();
        duplicate.prop("disabled", true);
        remove.prop("disabled", true);
      }

      $(".window-img").draggable({ revert: "invalid" });
  
      clear.off('click').on('click', clearFunction);
        
      undo.off('click').on('click', undoFunction);

      redo.off("click").on("click", redoFunction);

      duplicate.off("click").on("click", duplicateFunction);

      remove.off("click").on("click", removeFunction);

      undo.prop("disabled", true);
      redo.prop("disabled", true);
      duplicate.prop("disabled", true);
      remove.prop("disabled", true);

      if(currLine.windows != null && currLine.windows.length > 0){
        undoStack = currLine.undoStack;

        for(var i=0; i < currLine.windows.length; ++i){
          addWindow(currLine.windows[i].top, currLine.windows[i].left, (currLine.windows[i].height/GRID_SIZE).toFixed(1), (currLine.windows[i].width/GRID_SIZE).toFixed(1), currLine.windows[i].relativeHeight, currLine.windows[i].relativeWidth);
        }

        constructWall();
        
        clear.prop("disabled", false);
        undo.prop("disabled", false);
        redo.prop("disabled", true);

        
      }
    }
  }
});

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


directives.directive("drawRoom", function(){
  return {
    restrict: "A",
    link: function(scope, element, attrs, $window){
    
      var pi2 = Math.PI * 2;

      // variable that decides if something should be drawn on mousemove
      var isDown = false;
      
      // the last coordinates before the current move
      var lastX = 0;
      var lastY = 0;
      var startX = 0;
      var startY = 0;
      var startXTile = 0;
      var startYTile = 0;
      var destX = 0;
      var destY = 0;
      var destXTile = 0;
      var destYTile = 0;
 
      var isFirst = true;
      var isValidLine = false;
      var radius = 10;

      var strokeWidth = "4";

      var unitPerGrid = 0.5;
      var unitText = "m";
      var touchRadius = 1.5 * GRID_SIZE; // 1.5 times grid
      var excessTop, excessLeft;
      
      var lines = [ ];
      var points = [ ];
      var undoStack = [ ];
      var redoStack = [ ];
      var currentStartPoint;
      var invalidStartPoint;
      var done = false;
      var dashed = 0;
      var dashedMax = 5;
      var lineWidth = 2;
      var onThePathPoints = [];
      var isPoly;
 
      var Renderer = function(canvas, width, height, offsetLeft, offsetTop) {
          this.canvas   = canvas;
          this.context  = canvas.getContext('2d');
          this.tilesize = GRID_SIZE;
      };
 
      Renderer.prototype.resize = function(width, height, offsetLeft, offsetTop) {
          this.canvas.width = width;
          this.canvas.height = height;
          this.offsetLeft = offsetLeft;
          this.offsetTop = offsetTop;
      };

      Renderer.prototype.renderTouchPoint = function(x, y, radius, fill, stroke){
        var ctx = this.context;
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.arc(x, y, radius, 0, pi2, false);
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.fill();
        ctx.stroke();
      };

      Renderer.prototype.renderRoundedRectangle = function(x, y, w, h, rad, fill, stroke){
        var context = this.context;
        var r = x + w;
        var b = y + h;
        context.beginPath();
        context.strokeStyle=stroke;
        context.fillStyle=fill;
        context.moveTo(x+radius, y);
        context.lineTo(r-radius, y);
        context.quadraticCurveTo(r, y, r, y+radius);
        context.lineTo(r, y+h-radius);
        context.quadraticCurveTo(r, b, r-radius, b);
        context.lineTo(x+radius, b);
        context.quadraticCurveTo(x, b, x, b-radius);
        context.lineTo(x, y+radius);
        context.quadraticCurveTo(x, y, x+radius, y);
        context.fill();
        context.stroke();
      };
 
      Renderer.prototype.getWidth = function() {
          return this.canvas.width;
      };
 
      Renderer.prototype.getHeight = function() {
          return this.canvas.height;
      };
 
      Renderer.prototype.renderMap = function() {
          var height = this.getHeight();
          var width = this.getWidth();
          var rows = Math.floor(height / (this.tilesize * 1.0));
          var cols = Math.floor(width / (this.tilesize * 1.0));
          excessTop = 0; //(height - rows*this.tilesize) / 2.0;
          excessLeft = 0; //(width - cols*this.tilesize) / 2.0;
          
          for(var i=0; i <= rows; ++i){
            var vertical = excessTop + i*this.tilesize;
            this.drawLine(0, vertical, width, vertical, gridColor, null, 1);
          }

          for(var j=0; j <= cols; ++j){
            var horizontal = excessLeft + j*this.tilesize;
            this.drawLine(horizontal, 0, horizontal, height, gridColor, null, 1);
          }
      };
 
      Renderer.prototype.renderText = function(text, midX, midY, fillStyle, renderBackground){
        this.context.save();
        if(renderBackground){
          var textLen = text.length;
          var width = textLen/2.0 * GRID_SIZE + 20;
          var height = 2 * GRID_SIZE;
          this.renderRoundedRectangle(midX - width/2.0, midY - height/2.0, width, height, radius, white, white);
        }
        this.context.font = '14pt Rumpelstiltskin';
        this.context.textAlign = "center";
        this.context.fillStyle = fillStyle ? fillStyle : blackStroke;
        this.context.fillText(text, midX, midY + GRID_SIZE/2.0);
        this.context.restore();
      }
     
      Renderer.prototype.drawLine = function(startX, startY, toX, toY, strokeStyle, dashed, width){
        this.context.beginPath();
        this.context.setLineDash(dashed ? [5] : []);
        this.context.moveTo(startX, startY);
        this.context.lineTo(toX, toY);
        this.context.strokeStyle = strokeStyle;
        this.context.lineWidth = width ? width : lineWidth;
        this.context.stroke();
      }

      Renderer.prototype.clear = function(){
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      
      function getMidPoint(x1, y1, x2, y2){
        return {
          x: (x1+x2)/2.0,
          y: (y1+y2)/2.0
        }
      }
 
      function displayMessage(message){
        //$(".instruction").text(message);
      }
 
      function lineIntersect(x1,y1,x2,y2, x3,y3,x4,y4) {
        var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
        var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
        if (isNaN(x)||isNaN(y)) {
            return false;
        } else {
            if (x1>=x2) {
                if (!(x2<=x&&x<=x1)) {return false;}
            } else {
                if (!(x1<=x&&x<=x2)) {return false;}
            }
            if (y1>=y2) {
                if (!(y2<=y&&y<=y1)) {return false;}
            } else {
                if (!(y1<=y&&y<=y2)) {return false;}
            }
            if (x3>=x4) {
                if (!(x4<=x&&x<=x3)) {return false;}
            } else {
                if (!(x3<=x&&x<=x4)) {return false;}
            }
            if (y3>=y4) {
                if (!(y4<=y&&y<=y3)) {return false;}
            } else {
                if (!(y3<=y&&y<=y4)) {return false;}
            }
        }
        return true;
      }
 
      function polygonArea(points){
        var area = 0;         // Accumulates area in the loop
        var numPoints = points.length;
        var j = numPoints-1;  // The last vertex is the 'previous' one to the first
 
        for (var i = 0; i < numPoints; i++){
          area = area +  (normalizePoint(points[j].x)+normalizePoint(points[i].x)) * (normalizePoint(points[j].y)-normalizePoint(points[i].y)); 
          j = i;  //j is previous vertex to i
        }
 
        area = Math.abs(area/2 * Math.pow(unitPerGrid, 2));
        area = +area.toFixed(1);
 
        return area;
      }
 
      function normalizePoint(coord){
        return (coord - (GRID_SIZE/2.0))/GRID_SIZE;
      }
 
      function getLineIntersection(sourceX, sourceY, destX, destY){
        var intersect = false;
        for(var i=0; i< lines.length; ++i){
          var line = lines[i];
          if(line.start.open && line.start.id == currentStartPoint.id || line.end.open && line.end.id == currentStartPoint.id){
            //check parallelity of line
            var slopeDest = Math.abs((destY - sourceY)*0.1/(destX - sourceX) );
            var slopeOrigin = Math.abs((line.end.y - line.start.y)*0.1/(line.end.x - line.start.x));
            if(slopeDest == slopeOrigin){
              intersect = true; // invalid intersection
              break;
            }
          }
        }
        
        if(intersect === true){
          return intersect;
        }

        for(var i=0; i< lines.length; ++i){
          var line = lines[i];
          if(line.start.open && line.start.id == currentStartPoint.id || line.end.open && line.end.id == currentStartPoint.id){
            continue;
          }

          if(lineIntersect(line.start.x, line.start.y, line.end.x, line.end.y, sourceX, sourceY, destX, destY)){
              intersect = true; // check if it's valid intersection
              if(line.start.open == true && line.start.x == destX && line.start.y == destY){
                intersect = line.start;
              } else if(line.end.open == true && line.end.x == destX && line.end.y == destY){
                intersect = line.end;
              }
              break;
            }
          }
        return intersect;
      }
 
      function isMatchPoint(destX, destY){
        var retPoint = false;
        for(var i=0; i< points.length; ++i){
          var point = points[i];
          if(point.open){
            if(point.currentStart)
              continue;
            
            point.met = false;

            if(Math.sqrt(Math.pow(point.x - destX, 2) + Math.pow(point.y - destY, 2)) <= touchRadius) {
              point.met = true;
              retPoint = point;
              break;
            }
          }
        }
        return retPoint;
      }
 
      function onResize(){
        var mainObj = $(main);
          var width = mainObj.width();
          var height = mainObj.height();
          var offsetTop = mainObj.offset().top;
          var offsetLeft = mainObj.offset().left;
          renderer.resize(width, height, offsetLeft, offsetTop);
          tempRenderer.resize(width, height, offsetLeft, offsetTop);
          actualRenderer.resize(width, height, offsetLeft, offsetTop);
          animationRenderer.resize(width, height, offsetLeft, offsetTop);
        //renderer.renderMap();
      }
 
      function isDone(){
        var done = true;
        for(var i=0; i< points.length; ++i){
          var point = points[i];
              if(point.open == true){
                done = false;
                break;
              }
            };
        return done;
      }
 
      // Use the correct document according to the window argument
      var document = window.document;
      var status = 0;
       
      // Extract the canvas we want to use
      var main = element[0];
      var background = main.querySelector('#background');
      var temp = main.querySelector('#temp');
      var actual = main.querySelector('#actual');
      var animation = main.querySelector("#animation");
       
      // Instantiate objects
      var renderer = new Renderer(background, window.innerWidth, window.innerHeight);
      var tempRenderer = new Renderer(temp, window.innerWidth, window.innerHeight);
      var actualRenderer = new Renderer(actual, window.innerWidth, window.innerHeight);
      var animationRenderer = new Renderer(animation, window.innerWidth, window.innerHeight);

      onResize();

      window.requestAnimFrame = (function(callback) {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 60);
        };
      })();

      function animate(startTime) {
        // update
        var time = (new Date()).getTime() - startTime;

        animationRenderer.clear();

        for(var c=0; c < points.length; ++c){
          var point = points[c];
          if(point.open){
            if(point.forward && point.animationRadius + 1 > touchRadius){
              point.forward = false;
            }
            else if(!point.forward && point.animationRadius - 1 < touchRadius-10){
              point.forward = true;
            }

            point.animationRadius += point.forward ? 1 : -1;
            if(point.met){
              animationRenderer.renderTouchPoint(point.x, point.y, point.animationRadius, metFill, metStroke);
            }else{
              animationRenderer.renderTouchPoint(point.x, point.y, point.animationRadius, touchFill, touchStroke);
            }
          }
        }

        if(onThePathPoints.length > 0){
          dashed += 1/10;
          if(dashed > dashedMax) dashed = 0;
        }

        for(var d=0; d < onThePathPoints.length; ++d){
          var point = onThePathPoints[d].point;
          if(onThePathPoints[d].align == 'x'){
            animationRenderer.drawLine(point.x, point.y + dashed, destX, destY, metStroke, true);
          }else{
            animationRenderer.drawLine(point.x + dashed, point.y, destX, destY, metStroke, true);
          }
        }

        // request new frame
        requestAnimFrame(function() {
          animate(startTime);
        });
      }
     
      window.addEventListener('resize', function() {
          onResize();
      });
 
      $(main).on('touchstart mousedown', function(e){
        e.preventDefault();
         
        if(!done){
           
          var touchMouseEvent = normalizeEvent(e);
          if(touchMouseEvent == null){
            isDown = false;
            return;
          }
          
          var x = ((touchMouseEvent.pageX - renderer.offsetLeft) / renderer.tilesize) | 0;
          var y = ((touchMouseEvent.pageY - renderer.offsetTop) / renderer.tilesize) | 0;
          startXTile = x;
          startYTile = y;
          startX = (x + 0.5) * renderer.tilesize;
          startY = (y + 0.5) * renderer.tilesize;
          invalidStartPoint = false;
 
          if(!isFirst){
            currentStartPoint = isMatchPoint(startX, startY);
            if(currentStartPoint === false){
              invalidStartPoint = true;
              if(invalidStartPoint){
                displayMessage("Please create adjacent lines from existing lines");
              } else {
                displayMessage("");
              }
              return false;
            }
            currentStartPoint.currentStart = true;
            startX = currentStartPoint.x;
            startY = currentStartPoint.y;
          }
 
          isDown = true;
          isValidLine = true;
 
          tempRenderer.clear();
            $("#temp").css({
                left: 0,
                top: 0
            });
          }
      });
      
      $(main).on('touchmove mousemove', function(e) {
        e.preventDefault();  
         
        var touchMouseEvent = normalizeEvent(e);
        if(touchMouseEvent == null){
          isDown = false;
          return;
        }
         
        if(!done){
          if(isDown){
            
            var x = ((touchMouseEvent.pageX - renderer.offsetLeft) / renderer.tilesize) | 0;
            var y = ((touchMouseEvent.pageY - renderer.offsetTop) / renderer.tilesize) | 0;
            
            if(destXTile == x && destYTile == y){
              return;
            }
             
            destXTile = x;
            destYTile = y;
            destX = (x + 0.5) *renderer.tilesize;
            destY = (y + 0.5) *renderer.tilesize;
            
            isValidLine = true;
            
            var retPoint;
            var intersect = getLineIntersection(startX, startY, destX, destY);
            if(intersect === true){
              isValidLine = false;
            } else {
              retPoint = isMatchPoint(destX, destY);
              if(retPoint !== false){
                destX = retPoint.x;
                destY = retPoint.y;
              }
            }
            
            tempRenderer.clear();
            
            var tempArray = [];
            if(isValidLine){
              for(var i=0; i < points.length; ++i){ 
                var point = points[i];
                var pathCrossed = false;
                if(!point.currentStart){
                    var destPoint = null;
                    if(point.x == destX){
                      destPoint = {
                        point: point,
                        align: 'x'
                      };
                    } else if(point.y == destY){
                      destPoint = {
                        point: point,
                        align: 'y'
                      };
                    }

                    if(destPoint !== null) {
                      var len = getLength(point.x, point.y, destX, destY) / renderer.tilesize * unitPerGrid;
                      len = +len.toFixed(1);
                      destPoint.length = len;
                      if(len > 0){
                        var midPoint = getMidPoint(point.x, point.y, destX, destY);
                        tempRenderer.renderText(len + unitText, midPoint.x, midPoint.y, metStroke, true);
                        tempArray.push(destPoint);
                      }
                    }
                  }
              }
            }
            onThePathPoints = tempArray;

            if(isValidLine){
              displayMessage("");
            } else {
              displayMessage("Lines cannot intersect each other");
            }

            var length = getLength(startX, startY, destX, destY) / renderer.tilesize * unitPerGrid;
            length = +length.toFixed(1);
 
            if(length > 0){
                if(isValidLine){
                  var midPoint = getMidPoint(startX, startY, destX, destY);
                  tempRenderer.drawLine(startX, startY, destX, destY, blackStroke);
                  tempRenderer.renderText(length + unitText, midPoint.x, midPoint.y, null, true); 
                } else {
                  tempRenderer.drawLine(startX, startY, destX, destY, invalidStroke);
                }
            }
          }
          }
      });

      $(main).on('mouseleave touchcancel', function(e){
        e.preventDefault();
        isDown = false;
        tempRenderer.clear();
        for(var i=0; i < points.length; ++i){
          points[i].met = false;
          points[i].currentStart = false;
        }
      });
   
      $(main).on('touchend mouseup', function(e){
        e.preventDefault();
        
        var touchMouseEvent = normalizeEvent(e);
        if(touchMouseEvent == null){
          isDown = false;
          return;
        }

        onThePathPoints = [];

        if(!isFirst){
          currentStartPoint.currentStart = false;
          currentStartPoint.met = false;
        }
         
        if(!done){
        if(isDown){
          var x = ((touchMouseEvent.pageX - renderer.offsetLeft) / renderer.tilesize) | 0;
          var y = ((touchMouseEvent.pageY - renderer.offsetTop) / renderer.tilesize) | 0;
          isDown = false;
          $("#temp").css({
              left: '-100%',
              top: 0
          });
          
          if(!isValidLine || (x == startXTile && y == startYTile)){
            return;
          }
 
          undoStack.push({
            points: angular.copy(points),
            lines: angular.copy(lines)
          });

          redoStack = [];
          $(".redo").prop("disabled", true);
           
          $(".undo").prop("disabled", false);
           
          destXTile = x;
          destYTile = y;
          destX = (x + 0.5) *renderer.tilesize;
          destY = (y + 0.5) *renderer.tilesize;
 
          var isIntersectionPoint = false;
          var retPoint = isMatchPoint(destX, destY);
          if(retPoint !== false){
            isIntersectionPoint = true;
          }
 
          if(isFirst){
            currentStartPoint = {
              x: startX,
              y: startY,
              id: 0,
              open: true,
              forward: true,
              animationRadius: 0,
              currentStart: false
            };
            points.push(currentStartPoint);
            $(".clear").prop("disabled", false);
            isFirst = false;
          } else {
            currentStartPoint.open = false;
          }
          
          var endPoint;
          if(isIntersectionPoint){
            endPoint = retPoint;
            endPoint.open = false;
          } else {
            endPoint = { 
              x: destX,
              y: destY,
              id: points.length,
              open: true,
              forward: true,
              animationRadius: 0,
              currentStart: false
            };
          }
          var length = getLength(currentStartPoint.x, currentStartPoint.y, endPoint.x, endPoint.y) / renderer.tilesize * unitPerGrid;
          length = +length.toFixed(1);
 
          // check if next point is occupied, if not, push it, else insert at position
          if(typeof points[currentStartPoint.id + 1] === 'undefined'){
            points.push(endPoint);
          } else {
            var tempId = endPoint.id = currentStartPoint.id;
            points.splice(tempId, 0, endPoint);
            for(var i = tempId + 1; i < points.length; ++i){
              points[i].id = i;
            }
          }
          
          var line = {
            start: currentStartPoint,
            end: endPoint,
            mid: getMidPoint(currentStartPoint.x, currentStartPoint.y, endPoint.x, endPoint.y),
            length: length,
            id: lines.length + 1,
            external: false,
            walls: [],
            direction: 0 //north
          };
          lines.push(line);
 
          actualRenderer.drawLine(startX, startY, endPoint.x, endPoint.y, blackStroke);
          actualRenderer.renderText(length + unitText, line.mid.x, line.mid.y, null, true); 

          done = isDone();
          if(done){
            
            var roomArea = polygonArea(points);
            $(".area-value").text(roomArea + " sq" + unitText);
            $(".area").css("display", "inline-block");
            
            $(".next").prop("disabled", false);

            points.pop();
            
            //var sortedLines = [];
            var vertices = angular.copy(points);

            currentRoom.roomPoints = points;
            currentRoom.roomLines = lines;
            currentRoom.roomArea = roomArea;
            currentRoom.undoStack = undoStack;

            currentRoom.polygon = createPolygon(vertices);

            var midX = currentRoom.polygon.minX + (currentRoom.polygon.maxX - currentRoom.polygon.minX)/2;
            var midY = currentRoom.polygon.minY + (currentRoom.polygon.maxY - currentRoom.polygon.minY)/2;

            //translate all points by centroid
            for(var x=0; x<currentRoom.polygon.vertices.length; x++){
             currentRoom.polygon.vertices[x].x -= midX;
             currentRoom.polygon.vertices[x].y -= midY;
            }

            currentRoom.isClockwise = isClockwise(currentRoom.polygon.vertices);

            //currentRoom.marginPolygon = createMarginPolygon(polygon);

          }
         }
       }
      });

      function redoFunction(){

        if(redoStack.length == 0){
          return;
        }
        
        undoStack.push({
          points: angular.copy(points),
          lines: angular.copy(lines)
        });

        var top = redoStack.pop();
        points = top.points;
        
        for(var i=0; i < points.length; ++i){
          points[i].met = false;
          points[i].currentStart = false;
        }

        lines = top.lines;
        //need to relink the points
        for(var j=0; j < lines.length; ++j){
          lines[j].start = points[lines[j].start.id];
          lines[j].end = points[lines[j].end.id];
        }

        bluerawLines();
        
        if(top.done){
          $(".next").prop("disabled", false);
          done = true;
          $(".area").show();
        }
        
        displayMessage("Draw Room Layout");
        if(redoStack.length == 0){
            $(".redo").prop("disabled", true);
        }
      }

      function undoFunction(){
        if(undoStack.length == 0){
          return;
        }
        
        redoStack.push({
          points: angular.copy(points),
          lines: angular.copy(lines),
          done: done
        });

        $(".next").prop("disabled", true);
        $(".redo").prop("disabled", false);

        var top = undoStack.pop();
        points = top.points;
        
        for(var i=0; i < points.length; ++i){
          points[i].met = false;
          points[i].currentStart = false;
        }

        lines = top.lines;
        //need to relink the points
        for(var j=0; j < lines.length; ++j){
          lines[j].start = points[lines[j].start.id];
          lines[j].end = points[lines[j].end.id];
        }

        bluerawLines();
         
        done = false;
        $(".area").hide();
        displayMessage("Draw Room Layout");
        if(undoStack.length == 0){
            isFirst = true;
            $(".undo").prop("disabled", true);
        }

      }

      function clearFunction(e){
        isFirst = true;
        done = false;
        lines = [ ];
        points = [ ];
        undoStack = [ ];
        actualRenderer.clear();
        renderer.clear();
        tempRenderer.clear();
        actualRenderer.clear();
        $(".area").hide();
        $(".clear").prop("disabled", true);
        $(".undo").prop("disabled", true);
        $(".next").prop("disabled", true);
      }
       
      function bluerawLines(){
        actualRenderer.clear();
        for(var i=0; i < lines.length; ++i){
          var line = lines[i];
          actualRenderer.drawLine(line.start.x, line.start.y, line.end.x, line.end.y, blackStroke);
          actualRenderer.renderText(line.length + unitText, line.mid.x, line.mid.y, null, true);
        }
      }
     
      //Register event handlers
      $(".clear").off('click').on('click', clearFunction);
      $(".undo").off('click').on('click', undoFunction);
      $(".redo").off("click").on("click", redoFunction);

      if(currentRoom != null && currentRoom.roomPoints && currentRoom.roomLines){
        isFirst = false;
        lines = currentRoom.roomLines;
        points = currentRoom.roomPoints;
        undoStack = currentRoom.undoStack;
        //undoStack.push(currentRoom.undoStack[currentRoom.undoStack.length-1]);
        //undoFunction();

        $(".clear").prop("disabled", false);
        $(".undo").prop("disabled", false);
        $(".redo").prop("disabled", true);
        $(".area-value").text(currentRoom.roomArea + " sq" + unitText);
        $(".area").css("display", "inline-block");
        
        $(".next").prop("disabled", false);

        bluerawLines();
        done = true;
      }

      // wait one second before starting animation
      setTimeout(function() {
        var startTime = (new Date()).getTime();
        animate(startTime);
      }, 1000);

    }//END LINK
  
  };//END RETURN

});//END DIRECTIVE

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


directives.directive("roomInfo", function(){
  return {
    restrict: "A",
    link: function(scope, element, attrs, $window){
    	

    }//end link
 }//end return
});//end all



