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