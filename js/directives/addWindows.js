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