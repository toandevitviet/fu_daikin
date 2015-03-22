'use strict';

var blue = new THREE.Color("#e74c3c");

var gray = new THREE.Color('#5BC9F4');

var invalidStroke = "#ff0000";

var blackStroke = "#888888";

var grayStroke = "#bbbbbb";

var white = 'rgba(255,255,255,.8)';

var metFill = 'hsla(190, 80%, 50%, .4)';

var metStroke = 'hsla(190, 80%, 50%, .8)';

var touchFill = 'hsla(0, 0%, 0%, .1)';

var touchStroke = 'hsla(0, 0%, 0%, .4)';

var gridColor = "rgba(0,0,0,.2)";

var thickness = 8;

var lineMaterial = new THREE.LineBasicMaterial({color: 0x0000ff});

var tempWindow;

var renderers = [];

var GRID_SIZE = 20;

var CEILING_HEIGHT = {
  MIN: 2,
  DEFAULT: 2.7,
  MAX: 6
};

var MAX_ROOM_PER_ROW = 3;

var ONE_SIXTH_PI = Math.PI/6;
var ONE_FOURTH_PI = Math.PI/4;

var currentRoom = sessionStorage.currentRoom ? JSON.parse(sessionStorage.currentRoom) : null;

var rooms = sessionStorage.rooms ? JSON.parse(sessionStorage.rooms) : [];

var houseType = sessionStorage.houseType ? sessionStorage.houseType : null;

var previousCeilingHeight = sessionStorage.previousCeilingHeight ? sessionStorage.previousCeilingHeight : CEILING_HEIGHT.DEFAULT;

var settings = sessionStorage.settings ? JSON.parse(sessionStorage.settings) : { hideHelp: false, audioMuted: false };

var TurbulenzEngine;
var graphicsDevice;
var draw2D;

/* Common Function */

function directionToRadian(direction){
    switch(direction){
        case 'n' : return 0;
        case 'nw': return 1;
        case 'w' : return 2;
        case 'sw': return 3;
        case 's' : return 4;
        case 'se': return 5;
        case 'e' : return 6;
        case 'ne': return 7;
      }
}

function getDirectionName(fixedDirection){
  switch(fixedDirection){
    case 0: return 'North';
    case 1: return 'North West';
    case 2: return 'West';
    case 3: return 'South West';
    case 4: return 'South';
    case 5: return 'South East';
    case 6: return 'East';
    case 7: return 'North East';
  }
}

function getRadianFromFixedDirection(fixedDirection){
  return fixedDirection*ONE_FOURTH_PI;
}

function getDirection(radian){
    var no = (Math.floor(radian/ONE_SIXTH_PI) + 12) % 12;
    switch(no){
        case 0: return 0;
        case 1: return 1;
        case 2: case 3: return 2;
        case 4: return 3;
        case 5: case 6: return 4;
        case 7: return 5;
        case 8: case 9: return 6;
        case 11: return 7;
    }
}

function pointCameraTo (myObject, bbox, camera, controls ) {

    // Refocus camera to the center of the new object
    var COG = bbox.center();

    var v = new THREE.Vector3();
    v.subVectors(COG,controls.target);

    camera.position.addVectors(camera.position,v);

    // retrieve camera orientation and pass it to trackball  
    camera.lookAt(COG);
    controls.target.set( COG.x,COG.y,COG.z );  

};

function bboxCenter(myObject){
  
  myObject.geometry.computeBoundingBox();

  var middle  = new THREE.Vector3()
  middle.x  = ( geometry.boundingBox.x[ 1 ] + geometry.boundingBox.x[ 0 ] ) / 2;
  middle.y  = ( geometry.boundingBox.y[ 1 ] + geometry.boundingBox.y[ 0 ] ) / 2;
  middle.z  = ( geometry.boundingBox.z[ 1 ] + geometry.boundingBox.z[ 0 ] ) / 2;

  return middle;
}

function boundingBox(myObject){
  var bbox = new THREE.Box3().setFromObject( myObject );
  return bbox;
}

/**
 *  Zoom to object
 */
function zoomObject (myObject, camera, controls, sphereCoefficient ) {

   var bbox = boundingBox(myObject);
   if (bbox.empty()) {
       return;
   }
   
   var COG =  bbox.center();

   pointCameraTo(myObject, bbox, camera, controls);

   var sphereSize = bbox.size().length() * (sphereCoefficient? sphereCoefficient : 0.5);
   var distToCenter = sphereSize/Math.sin( Math.PI / 210.0 * camera.fov * 0.5);

   // move the camera backward 

   var target = controls.target;
   var vec = new THREE.Vector3();
   vec.subVectors( camera.position, target );
   vec.setLength( distToCenter );
   camera.position.addVectors(  vec , target );
   camera.updateProjectionMatrix();
   
   //render();
   //render3D();

};

function saveToSessionStorage(){
  sessionStorage.houseType = houseType;
  sessionStorage.rooms = JSON.stringify(rooms);
  sessionStorage.currentRoom = JSON.stringify(currentRoom);
  sessionStorage.previousCeilingHeight = previousCeilingHeight;
}

function saveSettingsToSessionStorage(){
  sessionStorage.settings = JSON.stringify(settings);
}

function addLine(scene, x1, y1, z1, x2, y2, z2){
  var geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(x1, y1, z1));
  geometry.vertices.push(new THREE.Vector3(x2, y2, z2));

  var line = new THREE.Line(geometry, lineMaterial);

  scene.add(line);
}

function calculateOuterInnerLines(thickness, x1, y1, x2, y2){
  var tetha = Math.atan(-1/((y2-y1)/(x2-x1))); 
  
  var innerX1New, innerY1New, innerX2New, innerY2New;
  var yNeg = y2 < y1;

  innerX1New = x1 - (yNeg ? -1 : 1) *thickness*Math.cos(tetha);
  innerY1New = y1 - thickness*Math.sin(tetha);
  innerX2New = x2 - (yNeg ? -1 : 1) *thickness*Math.cos(tetha);
  innerY2New = y2 - thickness*Math.sin(tetha);

  return {
    outerX1New : x1,
    outerY1New : y1,
    outerX2New : x2,
    outerY2New : y2,

    innerX1New : innerX1New,
    innerY1New : innerY1New,
    innerX2New : innerX2New,
    innerY2New : innerY2New
  };
}

function getLineIntersection(x1,y1,x2,y2, x3,y3,x4,y4) {
  var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
  var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
  return {
    x: x,
    y: y
  };
}

/* Construct room with existing windows */

function constructRoom(room, sortedLines, thickness, wallHeight, colorCallback, includeWindows){
  
  var expandedPoly = expandPoly(room.polygon, thickness);
  var expandedPoints = expandedPoly.vertices;
  var normalPoints = room.polygon.vertices;
  var objects = [];
  var parent = new THREE.Object3D();
  var superParent = new THREE.Object3D();

  var floorShape = new THREE.Shape();
  floorShape.moveTo(room.polygon.vertices[0].x, room.polygon.vertices[0].y);
  for(var a=1; a < room.polygon.vertices.length; ++a){
    floorShape.lineTo(room.polygon.vertices[a].x, room.polygon.vertices[a].y);
  }
  floorShape.lineTo(room.polygon.vertices[0].x, room.polygon.vertices[0].y);

  var floorGeometry = new THREE.ExtrudeGeometry( floorShape,{ amount: 1, bevelEnabled: false});
  var floorMaterial = new THREE.MeshLambertMaterial({ shading: THREE.FlatShading, color: gray });
  floorMaterial.side = THREE.DoubleSide;

  var floorMesh = new THREE.Mesh(floorGeometry);
  floorMesh.geometry.computeFaceNormals();
  floorMesh.geometry.computeVertexNormals();
  //mesh.overdraw = true;
  floorMesh.position.y = 0;
  floorMesh.rotation.x = Math.PI/2;

  var floorResult = new ThreeBSP(floorMesh).toMesh( floorMaterial );
  floorResult.geometry.computeFaceNormals();
  floorResult.geometry.computeVertexNormals();

  for(var b=0; b < room.polygon.edges.length; ++b){
    // The face material will be index #0.  The extrusion (sides) will be #1.
    var startPointIdx = getPointIdx(room.polygon.edges[b].start.id, normalPoints);
    var endPointIdx = getPointIdx(room.polygon.edges[b].end.id, normalPoints);
    var startOuter = expandedPoints[startPointIdx];
    var startInner = normalPoints[startPointIdx];
    var endOuter = expandedPoints[endPointIdx];
    var endInner = normalPoints[endPointIdx];
    
    var shape = new THREE.Shape();
    shape.moveTo(startOuter.x, startOuter.y);
    shape.lineTo(startInner.x, startInner.y);
    shape.lineTo(endInner.x, endInner.y);
    shape.lineTo(endOuter.x, endOuter.y);
    shape.lineTo(startOuter.x, startOuter.y);
 
    var geometry = new THREE.ExtrudeGeometry( shape,{ amount: wallHeight, bevelEnabled: false});
    var material = new THREE.MeshLambertMaterial({ shading: THREE.FlatShading, color: colorCallback(b, room.polygon.edges[b]) });
    material.side = THREE.DoubleSide;

    var mesh = new THREE.Mesh(geometry);
    mesh.geometry.computeFaceNormals();
    mesh.geometry.computeVertexNormals();
    mesh.position.y = wallHeight;
    mesh.rotation.x = Math.PI/2;

    if((includeWindows && includeWindows(b, room.polygon.edges[b]) || !includeWindows)
     && room.polygon.edges[b].windows && room.polygon.edges[b].windows.length > 0){
      var subtract_bsp = new ThreeBSP(mesh);
      var windows = sortedLines[b].windows;
      var parentObject = new THREE.Object3D();
      
      for(var w=0; w<windows.length; ++w){
      
        var boxGeo = new THREE.BoxGeometry(windows[w].width, windows[w].height, windows[w].thickness);
        var windowMaterial = new THREE.MeshNormalMaterial( { transparent: true, opacity: 0.25 } );
        windowMaterial.side = THREE.DoubleSide;
        
        var windowMesh = new THREE.Mesh(boxGeo, windowMaterial);
        windowMesh.overdraw = true;
        windowMesh.applyMatrix(windows[w].rotationMatrix);
        windowMesh.position.set(windows[w].x, windows[w].y, windows[w].z);
        
        var window_bsp = new ThreeBSP( windowMesh );
        window_bsp = window_bsp.intersect(subtract_bsp);

        subtract_bsp = subtract_bsp.subtract( window_bsp );

        parentObject.add(windowMesh);
      
      }

      var wallResult = subtract_bsp.toMesh( material );
      wallResult.geometry.computeFaceNormals();
      wallResult.geometry.computeVertexNormals();
      
      parentObject.add(wallResult);
      parent.add(parentObject);

      mesh = parentObject;

    }else{
      var wallResult = new ThreeBSP(mesh).toMesh( material );
      wallResult.geometry.computeFaceNormals();
      wallResult.geometry.computeVertexNormals();
      //wallResult.geometry.computeVertexNormals();

      parent.add(wallResult);

      mesh = wallResult;
    } 
    
    mesh.idx = b;
    
    objects.push(mesh);

  }

  superParent.add(floorResult);
  superParent.add(parent);
 
  return {
    parent: parent,
    superParent: superParent,
    objects: objects,
    floor: floorResult,
    expandedPoly: expandedPoly
  };
 
}

function init3DRoom(room, roomView, colorCallback, scaleFactor, rotation, customRenderer, includeWindows, sphereCoefficient){

  var roomViewWidth = roomView.width();
  var roomViewHeight = roomView.height();
  var _3DwallHeight = room.ceilingHeight * GRID_SIZE;

  var camera = new THREE.PerspectiveCamera( 45, roomViewWidth / roomViewHeight, 1, 6000 );
  camera.position.y = 800;
  camera.position.z = 1500;

  var controls = new THREE.OrbitControls( camera, roomView[0] );
  //controls.addEventListener( 'change', render );
  controls.maxPolarAngle = (Math.PI/2 - 0.001); 
  controls.minDistance = 0;
  controls.maxDistance = 4000;

  var scene = new THREE.Scene();

  // Plane
  
  var geometry = new THREE.PlaneGeometry( 100000, 100000 );
  var material = new THREE.MeshBasicMaterial( {color: 0xdddddd} );

  // Grid

  var projector = new THREE.Projector();
  var mouse2D = new THREE.Vector3( 0, 10000, 0.5 );

  var ambientLight = new THREE.AmbientLight( 0x777777 );
  scene.add( ambientLight );

  var directionalLight = new THREE.DirectionalLight( 0xffffff );
  directionalLight.position.x = -0.3704497358455519;
  directionalLight.position.y = 0.8303481835923215;
  directionalLight.position.z = -0.4162798184117182;
  directionalLight.position.normalize();
  directionalLight.castShadow = false;
  scene.add( directionalLight );

  var directionalLight = new THREE.DirectionalLight( 0x808080 );
  directionalLight.position.x = 0.4314326373398046;
  directionalLight.position.y = 0.6372289487054973;
  directionalLight.position.z = 0.6385962310957584;
  directionalLight.position.normalize();
  directionalLight.castShadow = false;
  scene.add( directionalLight );

  var renderer;
  if(customRenderer)
    renderer = customRenderer;
  else{
    renderer  = new THREE.WebGLRenderer({antialias:true, alpha: true});
    renderer.setClearColor( 0x000000, 0 );
  }
  
  renderer.setSize( roomViewWidth, roomViewHeight );
  roomView.append(renderer.domElement);

  var sortedLines = room.polygon.edges;
  
  // Construct Room
  var roomView = constructRoom(room, sortedLines, thickness, _3DwallHeight, colorCallback, includeWindows);

  var parent = roomView.parent;
  var objects = roomView.objects;
  var floor = roomView.floor;
  var superParent = roomView.superParent;

  var boundingBox = new THREE.Box3().setFromObject( parent );
  var boundingDeltaX = boundingBox.max.x - boundingBox.min.x;
  var boundingDeltaY = boundingBox.max.y - boundingBox.min.y;
  var boundingDeltaZ = boundingBox.max.z - boundingBox.max.z;
  
  var _3DscaleFactor = 1;//scaleFactor | 1; //(roomViewWidth * 0.5)/(boundingDeltaZ > boundingDeltaX ? boundingDeltaZ : boundingDeltaX);
  
  parent.scale.x = _3DscaleFactor;
  parent.scale.z = _3DscaleFactor;
  parent.scale.y = _3DscaleFactor;

  if(rotation && room.externalWallsIndexes.length > 0){
    var firstExternal = room.polygon.edges[room.externalWallsIndexes[0]];
    var rotationAmount = (room.isClockwise ? (Math.PI + firstExternal.tetha) : firstExternal.tetha ) + getRadianFromFixedDirection(firstExternal.direction);
    superParent.rotation.y = rotationAmount;
  }
   
  scene.add(superParent);

  zoomObject(superParent, camera, controls, sphereCoefficient);
  
  return{
    controls: controls,
    scene: scene,
    camera: camera,
    renderer: renderer,
    parent: parent,
    floor: floor,
    objects: objects,
    superParent: superParent
  };

} //END INIT 3D ROOM

function vecUnit(v) {
    var len = Math.sqrt(v.x * v.x + v.y * v.y);
    return { x: v.x / len, y: v.y / len };
}

function vecMul(v, s) {
    return { x: v.x * s, y: v.y * s };
}

function vecDot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
}

function vecRot90CW(v) {
    return { x: v.y, y: -v.x };
}

function vecRot90CCW(v) {
    return { x: -v.y, y: v.x };
}

function intersect(line1, line2) {
  var a1 = line1.end.x - line1.start.x;
  var b1 = line2.start.x - line2.end.x;
  var c1 = line2.start.x - line1.start.x;

  var a2 = line1.end.y - line1.start.y;
  var b2 = line2.start.y - line2.end.y;
  var c2 = line2.start.y - line1.start.y;

  var t = (b1*c2 - b2*c1) / (a2*b1 - a1*b2);

  return {
      x: line1.start.x + t * (line1.end.x - line1.start.x),
      y: line1.start.y + t * (line1.end.y - line1.start.y)
  };
}

function polyIsCw(p) {
  return vecDot(
      vecRot90CW({ x: p[1].x - p[0].x, y: p[1].y - p[0].y }),
      { x: p[2].x - p[1].x, y: p[2].y - p[1].y }) >= 0;
}

function getPointIdx(id, points){
  for(var loop=0; loop<points.length; loop++){
        if(points[loop].id == id){
              return loop;
        }
  }
}

function leftSide(vertex1, vertex2, p)
{
    return ((p.x - vertex1.x) * (vertex2.y - vertex1.y)) - ((vertex2.x - vertex1.x) * (p.y - vertex1.y));
}

function isReflexVertex(polygon, vertexIndex)
{
    // Assuming that polygon vertices are in clockwise order
    var thisVertex = polygon.vertices[vertexIndex];
    var nextVertex = polygon.vertices[(vertexIndex + 1) % polygon.vertices.length];
    var prevVertex = polygon.vertices[(vertexIndex + polygon.vertices.length - 1) % polygon.vertices.length];
    if (leftSide(prevVertex, nextVertex, thisVertex) < 0)
        return true;  // TBD: return true if thisVertex is inside polygon when thisVertex isn't included

    return false;
}

function getLength(x1,y1,x2,y2) {
    return Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2));
}


function inwardEdgeNormal(edge)
{
    // Assuming that polygon vertices are in clockwise order
    var dx = edge.end.x - edge.start.x;
    var dy = edge.end.y - edge.start.y;
    var edgeLength = Math.sqrt(dx*dx + dy*dy);
    return {x: -dy/edgeLength, y: dx/edgeLength};
}

function outwardEdgeNormal(edge)
{
    var n = inwardEdgeNormal(edge);
    return {x: -n.x, y: -n.y};
}

function isClockwise(vertices)
{
    var sum = 0.0;
    for (var i = 0; i < vertices.length; i++) {
        var v1 = vertices[i];
        var v2 = vertices[(i + 1) % vertices.length];
        sum += (v2.x - v1.x) * (v2.y + v1.y);
    }
    return sum > 0.0;
}

function createPolygon(vertices)
{
    var polygon = {vertices: vertices};

    var edges = [];
    var minX = (vertices.length > 0) ? vertices[0].x : undefined;
    var minY = (vertices.length > 0) ? vertices[0].y : undefined;
    var maxX = minX;
    var maxY = minY;

    for (var i = 0; i < polygon.vertices.length; i++) {
        //vertices[i].label = String(i);
        vertices[i].isReflex = isReflexVertex(polygon, i);
        var edge = {
            start: vertices[i], 
            end: vertices[(i + 1) % vertices.length], 
            id: i
        };
        edge.outwardNormal = outwardEdgeNormal(edge);
        edge.inwardNormal = inwardEdgeNormal(edge);

        var length = getLength(edge.start.x, edge.start.y, edge.end.x, edge.end.y) / GRID_SIZE * 1;
            length = +length.toFixed(4);

        var tetha = Math.atan2(edge.end.y - edge.start.y,edge.end.x - edge.start.x);
            
        edge.length = length;
        edge.tetha = tetha;
        edge.direction = 0;
        edge.windows = [];
        edge.external = false;

        edges.push(edge);
        var x = vertices[i].x;
        var y = vertices[i].y;
        minX = Math.min(x, minX);
        minY = Math.min(y, minY);
        maxX = Math.max(x, maxX);
        maxY = Math.max(y, maxY);
    }
    
    polygon.edges = edges;
    polygon.minX = minX;
    polygon.minY = minY;
    polygon.maxX = maxX;
    polygon.maxY = maxY;
    polygon.closed = true;

    return polygon;
}

function createOffsetEdge(edge, dx, dy)
{
    return {
        start: {x: edge.start.x + dx, y: edge.start.y + dy},
        end: {x: edge.end.x + dx, y: edge.end.y + dy}
    };
}

function expandPoly(polygon, distance) {
    
    var offsetEdges = [];
    for (var i = 0; i < polygon.edges.length; i++) {
        var edge = polygon.edges[i];
        var dx = edge.outwardNormal.x * distance;
        var dy = edge.outwardNormal.y * distance;
        offsetEdges.push(createOffsetEdge(edge, dx, dy));
    }

    var vertices = [];
    for (var i = 0; i < offsetEdges.length; i++) {
        var thisEdge = offsetEdges[i];
        var prevEdge = offsetEdges[(i + offsetEdges.length - 1) % offsetEdges.length];
        var vertex = edgesIntersection(prevEdge, thisEdge);
        if (vertex)
            vertices.push(vertex);
        else {
            var arcCenter = polygon.edges[i].start;
            appendArc(vertices, arcCenter, distance, prevEdge.end, thisEdge.start, false);
        }
    }

    var marginPolygon = createPolygon(vertices);
    marginPolygon.offsetEdges = offsetEdges;
    return marginPolygon;

/*
    var expanded = [];
    var rot = polyIsCw(p) ? vecRot90CCW : vecRot90CW;

    for (var i = 0; i < p.length; ++i) {

        // get this point (pt1), the point before it
        // (pt0) and the point that follows it (pt2)
        var pt0 = p[(i > 0) ? i - 1 : p.length - 1];
        var pt1 = p[i];
        var pt2 = p[(i < p.length - 1) ? i + 1 : 0];

        // find the line vectors of the lines going
        // into the current point
        var v01 = { x: pt1.x - pt0.x, y: pt1.y - pt0.y };
        var v12 = { x: pt2.x - pt1.x, y: pt2.y - pt1.y };

        // find the normals of the two lines, multiplied
        // to the distance that polygon should inflate
        var d01 = vecMul(vecUnit(rot(v01)), distance);
        var d12 = vecMul(vecUnit(rot(v12)), distance);

        // use the normals to find two points on the
        // lines parallel to the polygon lines
        var ptx0  = { x: pt0.x + d01.x, y: pt0.y + d01.y };
        var ptx10 = { x: pt1.x + d01.x, y: pt1.y + d01.y };
        var ptx12 = { x: pt1.x + d12.x, y: pt1.y + d12.y };
        var ptx2  = { x: pt2.x + d12.x, y: pt2.y + d12.y };

        // find the intersection of the two lines, and
        // add it to the expanded polygon
        expanded.push(intersect({start:ptx0, end:ptx10}, {start:ptx12, end:ptx2}));
    }
    return expanded;*/
}

var initializeRoom = function(){
    return {
        topLevel: true,
        roomType: "",
        roomLines: "",
        roomPoints: "",
        noOfExternal: 0,
        currentExternal: -1
    }
};

function normalizeEvent(e){
  var touchEvent, touchClickEvent = null;
     
  if(e.originalEvent instanceof TouchEvent){
    // check no of touches
    touchEvent = e.type == 'touchend' ? e.originalEvent.changedTouches : e.originalEvent.touches;
    if(touchEvent.length != 1){
      return;
    } else {
      touchClickEvent = {
        pageX: touchEvent[0].pageX,
        pageY: touchEvent[0].pageY
      };
    }
  } else {
    touchClickEvent = {
      pageX: e.pageX,
      pageY: e.pageY
    };
  }
  return touchClickEvent;
}

function edgesIntersection(edgeA, edgeB)
{
  var x1 = edgeA.start.x;
  var x2 = edgeA.end.x;
  var y1 = edgeA.start.y;
  var y2 = edgeA.end.y;
  var x3 = edgeB.start.x;
  var x4 = edgeB.end.x;
  var y3 = edgeB.start.y;
  var y4 = edgeB.end.y;
  
  var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
  var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
  return {
    x: x,
    y: y
  };  
  /*
  var den = (edgeB.vertex2.y - edgeB.vertex1.y) * (edgeA.vertex2.x - edgeA.vertex1.x) - (edgeB.vertex2.x - edgeB.vertex1.x) * (edgeA.vertex2.y - edgeA.vertex1.y);
    if (den == 0)
        return null;  // lines are parallel or conincident

    var ua = ((edgeB.vertex2.x - edgeB.vertex1.x) * (edgeA.vertex1.y - edgeB.vertex1.y) - (edgeB.vertex2.y - edgeB.vertex1.y) * (edgeA.vertex1.x - edgeB.vertex1.x)) / den;
    var ub = ((edgeA.vertex2.x - edgeA.vertex1.x) * (edgeA.vertex1.y - edgeB.vertex1.y) - (edgeA.vertex2.y - edgeA.vertex1.y) * (edgeA.vertex1.x - edgeB.vertex1.x)) / den;

    if (ua < 0 || ub < 0 || ua > 1 || ub > 1)
        return null;

    return {x: edgeA.vertex1.x + ua * (edgeA.vertex2.x - edgeA.vertex1.x),  y: edgeA.vertex1.y + ua * (edgeA.vertex2.y - edgeA.vertex1.y)};*/
}

function getCentroid(vertices){

    var centroid = {x:0, y:0};
    var signedArea = 0.0;
    var x0 = 0.0; // Current vertex X
    var y0 = 0.0; // Current vertex Y
    var x1 = 0.0; // Next vertex X
    var y1 = 0.0; // Next vertex Y
    var a = 0.0;  // Partial signed area

    // For all vertices except last
    var i=0;
    for (i=0; i<vertices.length-1; ++i)
    {
        x0 = vertices[i].x;
        y0 = vertices[i].y;
        x1 = vertices[i+1].x;
        y1 = vertices[i+1].y;
        a = x0*y1 - x1*y0;
        signedArea += a;
        centroid.x += (x0 + x1)*a;
        centroid.y += (y0 + y1)*a;
    }

    // Do last vertex
    x0 = vertices[i].x;
    y0 = vertices[i].y;
    x1 = vertices[0].x;
    y1 = vertices[0].y;
    a = x0*y1 - x1*y0;
    signedArea += a;
    centroid.x += (x0 + x1)*a;
    centroid.y += (y0 + y1)*a;

    signedArea *= 0.5;
    centroid.x /= (6.0*signedArea);
    centroid.y /= (6.0*signedArea);

    return centroid;
}

// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ngRoute',
  'ngAnimate',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.controllers',
  'ui.slider'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider
  .when('/settings', {templateUrl: 'partials/settings.html', controller: 'Settings'})
  .when('/introduction', {templateUrl: 'partials/introduction.html', controller: 'Introduction'})
  .when('/house-overview', {templateUrl: 'partials/house-overview.html', controller: 'HouseOverview'})
  .when('/house-type', {templateUrl: 'partials/house-type.html', controller: 'HouseType'})
  .when('/room-type', {templateUrl: 'partials/room-type.html', controller: 'RoomType'})
  .when('/draw-room', {templateUrl: 'partials/draw-room.html', controller: 'DrawRoom'})
  .when('/ceiling-height', {templateUrl: 'partials/ceiling-height.html', controller: 'CeilingHeight'})
  .when('/specify-walls', {templateUrl: 'partials/specify-walls.html', controller: 'SpecifyWalls'})
  .when('/add-windows', {templateUrl: 'partials/add-windows.html', controller: 'AddWindows'})
  .when('/room-specs/:id', {templateUrl: 'partials/room-specs.html', controller: 'RoomSpecs'})
  .when('/wall-direction',  {templateUrl: 'partials/wall-direction.html', controller: 'WallDirection'})
  .when('/algo', {templateUrl: 'partials/algo.html', controller: 'Algo'})
  .otherwise({redirectTo: '/specify-walls'});
}])
.run(function($rootScope, $location, $route, $timeout) {
    
    var animationNo = 0;
    var canvas = $(".mascot-img")[0];
    
    TurbulenzEngine = WebGLTurbulenzEngine.create({canvas: canvas});
    graphicsDevice = TurbulenzEngine.createGraphicsDevice({alpha: true, multisample: 4});
    draw2D = Draw2D.create({graphicsDevice: graphicsDevice});

    load("pichon", 0.8);
    //load("hero", 1);
    //load("goblins", 1);

    var atlas;
    var skeletonData;
    var skeletonName;
    function load (name, scale) {
      skeletonName = name;
      TurbulenzEngine.request("img/" + skeletonName + ".atlas", loadAtlas);

      function loadAtlas (atlasText) {
        var textureCount = 0;
        atlas = new spine.Atlas(atlasText, {
          load: function (page, path, atlas) {
            textureCount++;
            graphicsDevice.createTexture({
              src: "img/" + path,
              mipmaps: true,
              onload: function (texture) {
                page.rendererObject = texture;
                page.width = texture.width;
                page.height = texture.height;
                atlas.updateUVs(page);
                textureCount--;
              }
            });
          },
          unload: function (texture) {
            texture.destroy();
          }
        });

        function waitForTextures () {
          if (!textureCount)
            TurbulenzEngine.request("img/" + skeletonName + ".json", loadSkeletonData);
          else
            setTimeout(waitForTextures, 100);
        }
        waitForTextures();
        
        function loadSkeletonData (skeletonText) {
          var json = new spine.SkeletonJson(new spine.AtlasAttachmentLoader(atlas));
          json.scale = scale;
          skeletonData = json.readSkeletonData(JSON.parse(skeletonText));
          start();
        }
      }
    }

    function updateAnimation(state, eyeBlinkState, floatState){
      
      switch (animationNo){
        case 0: state.addAnimationByName(0, "hello", false, 5);
            break;
        case 1: floatState.clearTracks();
            state.setAnimationByName(0, "jump");
            break;
        case 2: floatState.addAnimationByName(0, "foot-tap", true, 0);
            state.addAnimationByName(0, "shake-body", false, 10);
            break;
        case 3: floatState.addAnimationByName(0, "swing-leg", true, 5);
            state.addAnimationByName(0, "shake-head", false, 10);
            break;
        case 4: floatState.addAnimationByName(0, "look-around", false, 0);
            floatState.addAnimationByName(0, "right-wink", false, 10);
            state.addAnimationByName(0, "bounce", false, 12);
            break;
        case 5: state.clearTracks();
            floatState.clearTracks();
            state.addAnimationByName(0, "jump", false, 0.5);
            floatState.addAnimationByName(0, "float", true, 2);
            break;
      }

    }

    function start () {
      spine.Bone.yDown = false;

      var skeleton = new spine.Skeleton(skeletonData);
      skeleton.x = 160;
      skeleton.y = 440;
      //skeleton.flipY = true;
      skeleton.setToSetupPose();
      skeleton.updateWorldTransform();

      var stateData = new spine.AnimationStateData(skeletonData); 
      var state = new spine.AnimationState(stateData);
      var eyeBlinkState = new spine.AnimationState(stateData);
      var floatState = new spine.AnimationState(stateData);

      //stateData.setMixByName("float", "hello", 1);

      state.addAnimationByName(0, "hello", false, 5);
      //state.addAnimationByName(0, "hello", false, 5);

      floatState.setAnimationByName(0, "float", true);

      eyeBlinkState.setAnimationByName(0, "blink", false);
      eyeBlinkState.addAnimationByName(0, "blink", true, 10);

      state.onComplete = function(i, count){
        if(i == state.tracks.length - 1 && count >= 1){
          animationNo = (animationNo + 1) % 6;
          setTimeout(function(){updateAnimation(state, eyeBlinkState, floatState)}, 5000);
        }
      }

      state.onEvent = function (trackIndex, event) {
        // alert(trackIndex + " event: " + event.data.name)
      }

      var bgColor = [0, 0, 0, 0.0];
      var batch = new SpriteBatch(draw2D);
      var lastTime = TurbulenzEngine.time;
      function update() {
        if (!graphicsDevice) return;

        var delta = TurbulenzEngine.time - lastTime;
        lastTime = TurbulenzEngine.time;
        
        eyeBlinkState.update(delta);
        floatState.update(delta);
        state.update(delta);
        eyeBlinkState.apply(skeleton);
        floatState.apply(skeleton);
        state.apply(skeleton);
        skeleton.updateWorldTransform();

        graphicsDevice.clear(bgColor,1.0);
        batch.begin(draw2D.blend.alpha);
        drawSkeleton(batch, skeleton);
        batch.end();
        graphicsDevice.endFrame();

      //  updateAnimation(state, eyeBlinkState, floatState);
      }

      TurbulenzEngine.setInterval(update, 1000 / 60);
    }

    var vertices = [];
    function drawSkeleton (batch, skeleton) {
      var drawOrder = skeleton.drawOrder;
      for (var i = 0, n = drawOrder.length; i < n; i++) {
        var slot = drawOrder[i];
        var attachment = slot.attachment;
        if (!(attachment instanceof spine.RegionAttachment)) continue;
        attachment.computeVertices(skeleton.x, skeleton.y, slot.bone, vertices);
        
        var blendMode = slot.data.additiveBlending ? draw2D.blend.additive : draw2D.blend.alpha;
        if (batch.blendMode != blendMode) {
          batch.end();
          batch.begin(blendMode);
        }

        batch.add(
          attachment.rendererObject.page.rendererObject,
          vertices[0], vertices[1],
          vertices[6], vertices[7],
          vertices[2], vertices[3],
          vertices[4], vertices[5],
          skeleton.r * slot.r,
          skeleton.g * slot.g,
          skeleton.b * slot.b,
          skeleton.a * slot.a,
          attachment.uvs[0], attachment.uvs[1],
          attachment.uvs[4], attachment.uvs[5]
        );
      }
    }

    function runSetup(){
      $rootScope.boolShowHelp = false;
      if(!$rootScope.settings.audioMuted){
        $("#audio")[0].play();
      }
    }

    $rootScope.settings = settings;

    $rootScope.muteAudio = function(){
      var muted = !$rootScope.settings.audioMuted;
      $rootScope.settings.audioMuted = muted;

      $("#audio")[0].volume = muted ? 0 : 1;
      if(!muted){
        $("#audio")[0].play();
      }

      saveSettingsToSessionStorage();
    }

    $rootScope.showHelp = function(ifShowHelp){
      $rootScope.currHelpIdx = 0;
        $rootScope.boolShowHelp = ifShowHelp;
    }

    $rootScope.goToSettings = function(){
      $location.path("/settings");
    }

    $rootScope.clearsessionStorage = function(){
      sessionStorage.removeItem('houseType');
      sessionStorage.removeItem('rooms');
      sessionStorage.removeItem('currentRoom');
      sessionStorage.removeItem('previousCeilingHeight');
      sessionStorage.removeItem('settings');
      $route.reload();
    }

    $rootScope.debugMode = true;

    $rootScope.$on("$routeChangeSuccess", function (event, newRoute, oldRoute) {
      if(!settings.hideHelp){
        $rootScope.boolShowHelp = true;
      }

      if(newRoute && newRoute.$$route && newRoute.$$route.controller != "Introduction"){
        $timeout(function(){
          var mainObj = $(".main");
          var width = mainObj.width();
          var height = mainObj.height();

          width = Math.floor(width/GRID_SIZE) * GRID_SIZE;
          height = Math.floor(height/GRID_SIZE) * GRID_SIZE;
          mainObj.width(width);
          mainObj.height(height);
        });
      }
    });

    runSetup();
});