'use strict';

/* Controllers */

angular.module('myApp.controllers', [])

/* Algo */

.controller('Algo', ['$scope', '$rootScope', '$location', function($scope, $rootScope, $location) {

    function getFCUModel(index){
        switch(parseInt(index)){
            case 1: return "FTKS25DVM" + " (Inverter Single Split)";
            case 2: return "FTKS35DVM" + " (Inverter Single Split)";
            case 3: return "FTKS50GVMG" + " (Inverter Single Split)";
            case 4: return "FTKS60GVMG" + " (Inverter Single Split)";
            case 5: return "FTKS71GVMG" + " (Inverter Single Split)";
            case 6: return "FTKS25DVM" + " (Inverter Multi Split)";
            case 7: return "FTKS35DVM" + " (Inverter Multi Split)";
            case 8: return "FTKS50BVMA" + " (Inverter Multi Split)";
            case 9: return "FTKS50DVM" + " (Inverter Multi Split)";
            case 10: return "FTKS60FVM" + " (Inverter Multi Split)";
            case 11: return "FTKS71FVM" + " (Inverter Multi Split)";
            case 12: return null;
            case 13: return null;
            case 14: return null;
            case 15: return null;
            case 16: return null;
            case 17: return null;
            case 18: return null;
            case 19: return null;
            case 20: return "FTN25HV1G" + " (Non Inverter Single Split)";
            case 21: return "FTN35HV1G" + " (Non Inverter Single Split)";
            case 22: return "FTN50HV1G" + " (Non Inverter Single Split)";
            case 23: return "FTN60JV1G" + " (Non Inverter Single Split)";
            case 24: return "FT25DVM" + " (Non Inverter Multi Split)";
            case 25: return "FT35DVM" + " (Non Inverter Multi Split)";
            case 26: return "FT50DVM" + " (Non Inverter Multi Split)";
            case 27: return null;
            default:  return null;
        }
    }

    function getCUModel(index){
        switch(parseInt(index)){
            case 1: return "RKS25GVMG" + " (Inverter Single Split)";
            case 2: return "RKS35GVMG" + " (Inverter Single Split)";
            case 3: return "RKS50GVMG" + " (Inverter Single Split)";
            case 4: return "RKS60GVMG" + " (Inverter Single Split)";
            case 5: return "RKS71GVMG" + " (Inverter Single Split)";
            case 6: return null;
            case 7: return null;
            case 8: return null;
            case 9: return null;
            case 10: return null;
            case 11: return null;
            case 12: return "2MKS40FV1B" + " (Inverter Multi Split)";
            case 13: return "3MKS50ESG" + " (Inverter Multi Split)";
            case 14: return "3MKS71ESG" + " (Inverter Multi Split)";
            case 15: return "4MKS80ESG" + " (Inverter Multi Split)";
            case 16: return "5MKS100LSG" + " (Inverter Multi Split)";
            case 17: return "RMKS112EVM" + " (Inverter Multi Split)";
            case 18: return "RMKS140EVM" + " (Inverter Multi Split)";
            case 19: return "RMKS160EVM" + " (Inverter Multi Split)";
            case 20: return "RN25HV1G" + " (Non Inverter Single Split)";
            case 21: return "RN35HV1G" + " (Non Inverter Single Split)";
            case 22: return "RN50HV1G" + " (Non Inverter Single Split)";
            case 23: return "RN60HV1G" + " (Non Inverter Single Split)";
            case 24: return null;
            case 25: return null;
            case 26: return null;
            case 27: return "MA56EV16" + " (Non Inverter Multi Split)";
            default:  return null;
        }
    }

    function getInverterSingleSplit(coolingCapacity, houseType){
        var a = coolingCapacity;
        var fcu = [];
        var cu = [];

        if(a <= 2.5){
            fcu = [1];
            cu = [1];
        } else if (a <= 3.5){
            fcu = [2];
            cu = [2];
        } else if (a <= 5){
            fcu = [3];
            cu = [3];
        } else if (a <= 6){
            fcu = [4];
            cu = [4];
        } else if (a <= 7.1 && houseType != 'hdb'){ //(a <= 7.1){
            fcu = [5];
            cu = [5];
        }

        return {
            fcu: fcu,
            cu: cu
        }
    }

    function getInverterMultiSplit(coolingCapacity, houseType){
        var a = coolingCapacity;
        var fcu = [];
        var cu = [];

        //fcu
        if(a <= 2.5){
            fcu = [6];
        } else if (a <= 3.5){
            fcu = [7];
        } else if (a <= 5){
            fcu = [8,9];
        } else if (a <= 6){
            fcu = [10];
        } else if (a <= 7.1 && houseType != 'hdb'){
            fcu = [11];
        }
        
        //cu
        if(a <= 4.50){
            cu = [12];
        } else if (a <= 6.70){
            cu = [13];
        } else if (a <= 8.25){
            cu = [14];
        } else if (a <= 9.70){
            cu = [15];
        } else if (a <= 11.20 && houseType != 'hdb'){
            cu = [16];
        } else if (a <= 13.00 && houseType != 'hdb'){
            cu = [17];
        } else if (a <= 15.30 && houseType != 'hdb'){
            cu = [18];
        } else if (a <= 16.40 && houseType != 'hdb'){
            cu = [19];
        }

        return {
            fcu: fcu,
            cu: cu
        }
    }

    function getNonInverterSingleSplit(coolingCapacity, houseType){
        var a = coolingCapacity;
        var fcu = [];
        var cu = [];

        if(a <= 2.5){
            fcu = [20];
            cu = [20];
        } else if (a <= 3.5){
            fcu = [21];
            cu = [21];
        } else if (a <= 5){
            fcu = [22];
            cu = [22];
        } else if (a <= 6){
            fcu = [23];
            cu = [23];
        }

        return {
            fcu: fcu,
            cu: cu
        }
    }

    function getNonInverterMultiSplit(coolingCapacity, houseType){
        var a = coolingCapacity;
        var fcu = [];
        var cu = [];
        
        if(a <= 2.5){
            fcu = [24];
        } else if (a <= 3.5){
            fcu = [25];
        } else if (a <= 5.0){
            fcu = [26];
        }

        if(a <= 6) { //if (a <= 6){
            cu = [27];
        }

        return {
            fcu: fcu,
            cu: cu
        }
    }

    function getRoomTypeFactor(roomType){
        switch(roomType){
            case 'Living/Dining Room with Kitchen': return 1; 
            case 'Living/Dining Room': return 1.10;
            case 'Bedroom': return 0.9;
            case 'Others': return 0;
            default: return 1;
        }
    }

    function getSumWallsSize(edges, ceilingHeight){
        var sumSize = 0;
        for(var j=0; j < edges.length; ++j){
            sumSize += ceilingHeight * edges[j].length;
        }
        return sumSize;
    }

    function getWallOrientationFactor(wallOrientation){
      switch(wallOrientation){
        case 0: return 1.30; //'North';
        case 1: return 1.50; //'North West';
        case 2: return 1.50; //'West';
        case 3: return 1.20; //'South West';
        case 4: return 1.05; //'South';
        case 5: return 1.15; //'South East';
        case 6: return 1.30; //'East';
        case 7: return 1.30; //'North East';
        default: return 1.00;
      }
    }

    var sample = {
        houseType: 'hdb',
        rooms: [
            {
                roomType: 'Bedroom',
                attributes: {
                    'coolingCapacity': 7.023015
                }
            },
            {
                roomType: 'Living/Dining Room',
                attributes: {
                    'coolingCapacity': 11.07936
                }
            }
        ]
    };

    function getRecommendation(houseType, rooms){
        var capExceeds = false;
        var totalCapacity = 0;
        var proposals = [];
        if(houseType == 'hdb'){
            for(var i=0; i < rooms.length; ++i){
                if(!(rooms[i].attributes && rooms[i].attributes.coolingCapacity != '-' &&
                    rooms[i].attributes.coolingCapacity < 12)){
                    return false;
                }

                var qty = 1;
                var coolingCapacity = rooms[i].attributes.coolingCapacity;
                totalCapacity += coolingCapacity;
                
                if(coolingCapacity > 6){
                    coolingCapacity = (coolingCapacity / 2).toFixed(1);
                    qty = 2;
                }

                rooms[i].attributes.fcu = {
                    qty: qty,
                    inverter: (qty == 1 ? getInverterSingleSplit(coolingCapacity, houseType) : 
                            getInverterMultiSplit(coolingCapacity, houseType)),
                    nonInverter: (qty == 1 ? getNonInverterSingleSplit(coolingCapacity, houseType) :
                             getNonInverterMultiSplit(coolingCapacity, houseType))
                };
            }
            if(totalCapacity < 8.6){
                proposals.push({type: 'Home', totalCaps: totalCapacity, rooms: rooms, cu: {inverter: [], nonInverter: []}});
            } else { // group by room type
                var livingDining = {type: 'Living/Dining Rooms', totalCaps: 0, rooms: [], cu: {inverter: [], nonInverter: []}},
                bedrooms = {type: 'Bedrooms', totalCaps: 0, rooms: [], cu: {inverter: [], nonInverter: []}};
            
                for(var i=0; i < rooms.length; ++i){
                    if(rooms[i].roomType == 'Living/Dining Room with Kitchen' ||
                        rooms[i].roomType == 'Living/Dining Room'){
                        livingDining.rooms.push(rooms[i]);
                        livingDining.totalCaps += rooms[i].attributes.coolingCapacity;
                    } else if(rooms[i].roomType == 'Bedroom') {
                        bedrooms.rooms.push(rooms[i]);
                        bedrooms.totalCaps += rooms[i].attributes.coolingCapacity;
                    }
                }

                proposals.push(bedrooms);
                proposals.push(livingDining);

            }

            for(var i=0; i < proposals.length; ++i){
                if(proposals[i].rooms.length > 1){
                    //inverter
                    var cuSingleSplit = getInverterSingleSplit(proposals[i].totalCaps, houseType);
                    if(cuSingleSplit.cu.length > 0) proposals[i].cu.inverter.push(cuSingleSplit);
                    //non-inverter
                    var nonCuSingleSplit = getNonInverterSingleSplit(proposals[i].totalCaps, houseType);
                    if(nonCuSingleSplit.cu.length > 0) proposals[i].cu.nonInverter.push(nonCuSingleSplit);
                } else {
                    //inverter
                    var cuMultiSplit = getInverterMultiSplit(proposals[i].totalCaps, houseType);
                    if(cuMultiSplit.cu.length > 0) proposals[i].cu.inverter.push(cuMultiSplit);
                    //non-inverter
                    var nonCuMultiSplit = getNonInverterMultiSplit(proposals[i].totalCaps, houseType);
                    if(nonCuMultiSplit.cu.length > 0) proposals[i].cu.nonInverter.push(nonCuMultiSplit);
                }
            }

        } else {
            for(var i=0; i < rooms.length; ++i){
                if(!(rooms[i].attributes && rooms[i].attributes.coolingCapacity != '-' &&
                    rooms[i].attributes.coolingCapacity < 15)){
                    return false;
                }

                var totalFCUs = 0;
                for(var i=0; i < rooms.length; ++i){
                    var qty = 1;
                    var coolingCapacity = rooms[i].attributes.coolingCapacity;
                    totalCapacity += coolingCapacity;
                    
                    if(coolingCapacity > 7.5){
                        coolingCapacity = coolingCapacity / 2;
                        qty = 2;
                    }

                    totalFCUs += qty;

                    rooms[i].attributes.fcu = {
                        qty: qty,
                        inverter: {
                            singleSplit: getInverterSingleSplit(capacity),
                            multiSplit: getInverterMultiSplit(capacity)
                        },
                        nonInverter: {
                            singleSplit: getNonInverterSingleSplit(capacity),
                            multiSplit: getNonInverterMultiSplit(capacity)
                        }
                    };
                }

                if(totalFCUs > 3 || totalCapacity > 16.4){ // group by room type

                }else{ 

                }
            }
            
        }
        return proposals;
    }

    function getCoolingCapacity(room){
        
        var roomAreaFactor = 0.2 * Math.pow(room.area,-0.112);
        var roofFactor = 1.08;
        var highCeilingFactor = 0.3*Math.log(room.ceilingHeight) + 0.65;
        var roomHeightFactor = roofFactor * highCeilingFactor;
        var roomTypeFactor = getRoomTypeFactor(room.roomType);
        
        var noOfWalls = room.polygon.edges.length;
        var sumWallFactors = 0;
        var sumWallsSize = getSumWallsSize(room.polygon.edges, room.ceilingHeight);
        
        var wallsAttributes = [];

        for(var i=0; i < room.polygon.edges.length; ++i){
            
            var wall = room.polygon.edges[i];
            var orientationFactor = getWallOrientationFactor(wall.direction);
            var wallSize = wall.length * room.ceilingHeight;
            var wallCorrection = (wallSize / sumWallsSize) * noOfWalls;
            
            var sumWindowSize = 0;
            for(var k=0; k < wall.windows.length; ++k){
                sumWindowSize += wall.windows[k].area;
            }

            var windowRatio = sumWindowSize / wallSize;
            var windowFactor = windowRatio * 0.75;

            var wallFactor = orientationFactor * wallCorrection * windowFactor;

            var wallAttributes = {
                orientationFactor: orientationFactor,
                wallSize: wallSize,
                wallCorrection: wallCorrection,
                sumWindowSize: sumWindowSize,
                windowRatio: windowRatio,
                windowFactor: windowFactor,
                wallFactor: wallFactor
            };

            wallsAttributes.push(wallAttributes);
        }

        var designFactor = roomAreaFactor * roomHeightFactor * roomTypeFactor;
        for(var l=0; l < wallsAttributes.length; ++l){
            designFactor *= wallsAttributes[l].wallFactor;
        }

        var coolingCapacity = designFactor * room.area;

        var roomAttributes = {
            roomAreaFactor: roomAreaFactor,
            roofFactor: roofFactor,
            highCeilingFactor: highCeilingFactor,
            roomHeightFactor: roomHeightFactor,
            roomTypeFactor: roomTypeFactor,
            noOfWalls: noOfWalls,
            sumWallFactors: sumWallFactors,
            sumWallsSize: sumWallsSize,
            wallsAttributes: wallsAttributes,
            designFactor: designFactor,
            coolingCapacity: coolingCapacity,
            fcu: '-'
        };

        room.attributes = roomAttributes;

        return isNaN(coolingCapacity) || coolingCapacity == Number.POSITIVE_INFINITY || coolingCapacity == Number.NEGATIVE_INFINITY ?
                '-' : (coolingCapacity.toFixed(4) * 1);
    }

    $rootScope.currentMascotIdx = 0;

    $rootScope.title = "Recommend Me a Daikin Aircon"
    $rootScope.subtitle = "Algorithm Test";
    $rootScope.instruction = "Enter necessary input and get the recommended aircon setup";
    
    $rootScope.bubbleText = "Hello";
    $rootScope.controller = "algo";
    
    $scope.rooms = [];    

    $scope.addRoom = function(){
        $scope.rooms.push({
            roomArea: null,
            ceilingHeight: null,
            roomType: null,
            topLevel: null,
            polygon: {
                edges: []
            },
            attributes: {
                recommendation: '-'
            }
        });
    }

    $scope.addWall = function(room){
        room.polygon.edges.push({
            length: null,
            direction: null,
            external: false,
            windows: []
        });
    }

    $scope.addWindow = function(wall){
        wall.windows.push({
            area: null
        });
    }

    $scope.getFCUModel = getFCUModel;
    $scope.getCUModel = getCUModel;

    $scope.getRecommendationTrigger = function(){
        var input = JSON.parse($scope.sample);
        var proposals = getRecommendation(input.houseType, input.rooms);
        $rootScope.proposals = proposals;
    }

    $scope.getCoolingCapacity = getCoolingCapacity;

    $scope.sample = JSON.stringify(sample, null, 4);

    $scope.addRoom();

}])

/* Settings */

.controller('Settings', ['$scope', '$rootScope', '$location', function($scope, $rootScope, $location) {

}])

/* House Type */

.controller('HouseType', ['$scope', '$rootScope', '$location', function($scope, $rootScope, $location) {
    
    $rootScope.currentMascotIdx = 0;

    $rootScope.title = "Recommend Me a Daikin Aircon"
    $rootScope.subtitle = "What is the type of your house?";
    $rootScope.instruction = "Select either the HDB or Private icon image to indicate the type of house you are living in";
    
    $rootScope.bubbleText = "Tap to select the type of your house";
    $rootScope.controller = "house-type";
    
    $scope.selectHouseType = function(selectedHouseType){
        houseType = selectedHouseType;
        saveToSessionStorage();
        $location.path("/house-overview");
    }

}])

/* Introduction */
.controller('Introduction', ['$scope', '$rootScope', '$location', '$timeout', '$window', function($scope, $rootScope, $location, $timeout, $window) {
    
    $rootScope.title = "Recommend Me a Daikin Aircon"
    $rootScope.subtitle = "";
    $rootScope.instruction = "";

    $rootScope.controller = "introduction";

    currentRoom = initializeRoom();

    $scope.conversationDone = false;
    $scope.currentIdx = 0;
    $scope.pichonkunImages = [{
        img: "img/leafblue.png",
        className: "pichon-4",
        messageClassName: "fade"
    }];

    $scope.messages = [
        "Shall we begin to explore your home together?"
    ];
    
    $scope.start = function(){
        saveToSessionStorage();
        $location.path("/house-type");
    }

    $timeout(function(){
        /*
        AdobeEdge.loadComposition('leaf', 'EDGE-52860910', {
            scaleToFit: "none",
            centerStage: "none",
            minW: "0",
            maxW: "undefined",
            width: "100%",
            height: "100%"
        }, {"dom":{}}, {"dom":{}});*/

    });

    $scope.skip = function(){
        $("#Stage").hide(); $(".message, .start-button, .pichon").removeClass("ng-hide"); $(".skip-button").addClass("ng-hide");
    }

}])

/* House Overview */

.controller('HouseOverview', ['$scope', '$rootScope', '$location', '$timeout', function($scope, $rootScope, $location, $timeout) {
    
    currentRoom = initializeRoom();

    $scope.thereIsRoom = rooms.length > 0;
    $scope.houseType = houseType;
    $scope.rooms = rooms;
    
    if($scope.thereIsRoom){
        $rootScope.currHelpIdx = 0;
        $scope.helpContents = [
            {
                "description": "Drag the 4-way arrow handler to the desired House Level section.",
                "img": "img/help/house-overview-1.gif",
                "className": "index-1"
            },
            {
                "description": "Tap on 'i' button to view the information of the particular room",
                "img": "img/help/house-overview-2.gif",
                "className": "index-2"
            },
            {
                "description": "Tap on 'Add' button to add more room or 'Done' to get Recommendation",
                "img": "img/help/house-overview-3.gif",
                "className": "index-3"
            }
        ];
        
        $scope.currHelp = $scope.helpContents[$rootScope.currHelpIdx];
        
        $scope.nextHelp = function(index){
            $rootScope.currHelpIdx = $rootScope.currHelpIdx + index;
            $scope.currHelp = $scope.helpContents[$rootScope.currHelpIdx];
        }
        
        $rootScope.currentMascotIdx = 1;

        $rootScope.title = "Recommend Me a Daikin Aircon"
        $rootScope.subtitle = "Overview of rooms you have created";
        $rootScope.instruction = "Using the drag icon located at the top right of each room’s preview box, tap and hold to position if the room is located on the Top Level or Ground Level of your house. If your HDB unit is located at the top most storey of the building, you should position all rooms at the Top Level section";
        $rootScope.bubbleText = "Tap and hold the Drag Icon to position if the room is located at the Top Level or Ground Level";
        
        $scope.getDirectionName = getDirectionName;
        $rootScope.controller = "house-overview-with-rooms";
        
        $scope.roomsControls = [];

        $scope.calcHeight = function(){
            if($(".top-level .vertical-align").children().length > MAX_ROOM_PER_ROW){
                $("body").attr("data-more-rooms", "top");
            } else if ($(".ground-level .vertical-align").children().length  > MAX_ROOM_PER_ROW){
                $("body").attr("data-more-rooms", "ground");
            } else {
                $("body").attr("data-more-rooms", "");
            }
        }

        $scope.animate = function(){
            requestAnimationFrame( $scope.animate );
            
            for(var i=0; i<$scope.roomsControls.length; ++i){
                var control = $scope.roomsControls[i];
                control.renderer.render(control.scene, control.camera);
                control.controls.update();
            }

        }

        $timeout(function(){

            var topLevel = $('.top-level');
            var groundLevel = $('.ground-level');

            var roomsControls = [];
            
            var countTop = 0;
            
            var countGround = 0;

            var oneThirdHeight = $(".house-overview").height()/3;

            for(var i=0; i<rooms.length; ++i){
                
                var roomView = $("<div class='a-room-view' data-id='"+i+"'><div class='a-room-header'><div class='a-room-type'>"+rooms[i].roomType+"</div><div class='a-room-handle'><img src='/img/handle.png'></div><a class='a-room-info' href='/#/room-specs/"+i+"' data-room='" + i +"'>i</a></div></div>");
                
                roomView.css("height", oneThirdHeight)

                if(rooms[i].topLevel){
                    roomView.appendTo($(".vertical-align",topLevel));
                    countTop++;
                } else {
                    roomView.appendTo($(".vertical-align",groundLevel));
                    countGround++;
                }

                var canvasContainer = $("<div class='a-room-canvas'></div>");
                canvasContainer.appendTo(roomView);
                
                $scope.roomsControls.push(init3DRoom(rooms[i], canvasContainer,  function(idx, currentLine){
                    return gray;
                }, 2, true));

                roomView.draggable({
                    handle: ".a-room-handle",
                    start: function(event, ui){
                        var room = $(event.target);
                        var id = parseInt(room.attr("data-id"));
                        var isTop = $scope.rooms[id].topLevel;
                        if(isTop){
                            $(".top").css("z-index", 1);
                            $(".ground").css("z-index", 0);
                        } else{
                            $(".top").css("z-index", 0);
                            $(".ground").css("z-index", 1);
                        }
                    }
                });
            }

           $scope.calcHeight();

            $('.top-level, .ground-level').droppable({
              accept: ".a-room-view",
              activeClass: "ui-state-hover",
              hoverClass: "ui-state-active",
              drop: function( event, ui ) {
                var me = $(event.target);
                var room = $(ui.draggable[0]);
                var id = parseInt(room.attr("data-id"));
                var isTop = me.hasClass("top-level");
                $scope.rooms[id].topLevel = isTop;
                $scope.$apply();
                room.appendTo($(".vertical-align",event.target)).removeAttr("style").css("height", oneThirdHeight);
                $scope.calcHeight();
                saveToSessionStorage();
              }
            });

            $scope.animate();
        });

    } else {
        
        $rootScope.currentMascotIdx = 2;

        $rootScope.title = "Recommend Me a Daikin Aircon"
        $rootScope.subtitle = "";
        $rootScope.instruction = "";
        $rootScope.bubbleText = "Tap to start adding a new room";
        
        $rootScope.controller = "house-overview-no-room";
    }

    $rootScope.addRoom = function(){
        $location.path("/room-type");
    }

    $rootScope.back = function(){
        $location.path("/house-type");
    }

    $rootScope.done = function(){

    }

}])

/* Room Type */

.controller('RoomType', ['$scope', '$rootScope', '$location', function($scope, $rootScope, $location) {
    
    $rootScope.currentMascotIdx = 3;

    $rootScope.title = "Recommend Me a Daikin Aircon";
    $rootScope.subtitle = "What is the type of room you would like to create?";
    $rootScope.instruction = "Select the respective image that best describes the room you would like to create";
    $rootScope.bubbleText = "Tap on the image to tell me the type of room you are currently creating";
    $rootScope.controller = "room-type";

    $scope.roomType = currentRoom ? currentRoom.roomType : null;
    
    $rootScope.cancel = function(){
        $location.path("/house-overview");
    }

    $rootScope.back = function(){
        $location.path("/house-overview");
    }
    
    $scope.$watch('roomType', function(newValue, oldValue) {
        if(newValue != oldValue){
            currentRoom.roomType = newValue;
            saveToSessionStorage();
            $location.path("/draw-room");
        }
    });

    jQuery(".next").prop("disabled", true);

}])

/* Draw Room */

.controller('DrawRoom', ['$scope', '$rootScope', '$location', function($scope, $rootScope, $location) {
    
    $rootScope.currentMascotIdx = 4;

    $rootScope.title = "Recommend Me a Daikin Aircon";
    $rootScope.subtitle = "What is the layout shape of your room?";
    $rootScope.instruction = "Using the canvas board, draw the layout shape of your room. Connect all points to form a complete shape without any gaps";
    $rootScope.bubbleText = "Draw to scale your room layout to tell me how it looks like";
        
    $rootScope.controller = "draw-room";
    $scope.roomType = currentRoom.roomType;

    $rootScope.cancel = function(){
        $location.path("/house-overview");
    }

    $rootScope.back = function(){
        $location.path("/room-type");
    }

    $rootScope.next = function(){
        saveToSessionStorage();
        $location.path("/ceiling-height");
    }
    
    $rootScope.currHelpIdx = 0;
        $scope.helpContents = [
            {
                "description": "Drag on a point in the canvas to start drawing and release to create a line.<br><br> Continue on from one of the flashing ends of the line and close the construct.",
                "img": "img/help/draw-room-1.gif",
                "className": "index-1"
            },
            {
                "description": "Tap on 'Undo' button to cancel your previous drawing",
                "img": "img/help/draw-room-2.gif",
                "className": "index-2"
            },
            {
                "description": "Tap on 'Redo' button to cancel your previous Undo",
                "img": "img/help/draw-room-3.gif",
                "className": "index-3"
            },
            {
                "description": "Tap on 'Clear' button to clear your drawing and start over",
                "img": "img/help/draw-room-4.gif",
                "className": "index-4"
            }
        ];
        
        $scope.currHelp = $scope.helpContents[$rootScope.currHelpIdx];
        
        $scope.nextHelp = function(index){
            $rootScope.currHelpIdx = $rootScope.currHelpIdx + index;
            $scope.currHelp = $scope.helpContents[$rootScope.currHelpIdx];
        }

    jQuery(".next").prop("disabled", true);

}])

/* Wall Direction */

.controller('WallDirection',['$scope', '$rootScope', '$location', function($scope, $rootScope, $location) {
    
    $rootScope.currentMascotIdx = 0;

    $rootScope.sectionTitle = "Recommend me a Daikin";
    $rootScope.sectionSubtitle = "What is the direction of your external wall?";
    $rootScope.instruction ="Using the empty space surrounding the room layout shape, swipe your finger to the right to rotate the external wall to face its respective direction"
    $rootScope.bubbleText = "Swipe to the right to tell me the direction the external wall is facing";
    
    $rootScope.controller = 'wall-direction'; 

    $rootScope.back = function(){
        currentRoom.currentExternal -= 1;
        for(var i=0; i<currentRoom.polygon.edges; ++i){
            currentRoom.polygon.edges[i].direction = 0;
        }

        saveToSessionStorage();

        $location.path("/add-windows");
    }

    $rootScope.cancel = function(){
        $location.path("/house-overview");
    }
    
    $rootScope.next = function(){
        
        //derive direction of other external walls!
        //var currentExternal = currentRoom.currentExternal;
        var initialIdx = currentRoom.externalWallsIndexes[0];
        var initialLine = currentRoom.polygon.edges[initialIdx];

        var startPoint = currentRoom.polygon.vertices[getPointIdx(initialLine.start.id, currentRoom.polygon.vertices)];
        var endPoint = currentRoom.polygon.vertices[getPointIdx(initialLine.end.id, currentRoom.polygon.vertices)];
        
        var initialTetha = initialLine.tetha;
        var initialDirection = initialLine.direction;

        for(var i=1; i < currentRoom.externalWallsIndexes.length; i++){
            var currentExternal = currentRoom.externalWallsIndexes[i];
            var currLine = currentRoom.polygon.edges[currentExternal];

            var currStartPoint = currentRoom.polygon.vertices[getPointIdx(currLine.start.id, currentRoom.polygon.vertices)];
            var currEndPoint = currentRoom.polygon.vertices[getPointIdx(currLine.end.id, currentRoom.polygon.vertices)];
        
            var deltaTetha = initialTetha - currLine.tetha;
            currLine.direction = getDirection(getRadianFromFixedDirection(initialDirection) + deltaTetha);
        }

        if(currentRoom.currentExternal == currentRoom.noOfExternal){
            //rooms.push(currentRoom);
            saveToSessionStorage();
            $location.path("/room-specs/current");
        } else {
            saveToSessionStorage();
            $location.path("/add-windows");
        }
    }

    jQuery(".next").prop("disabled", false);

}])

/* Add Windows */

.controller('AddWindows',['$route', '$scope', '$rootScope', '$location', function($route, $scope, $rootScope, $location) {
    
    $rootScope.currentMascotIdx = 2;

    $rootScope.title = "Recommend me a Daikin";
    $rootScope.subtitle = "Where are the windows positioned on the external wall (External Wall " + (currentRoom.currentExternal+1) + " of " + currentRoom.noOfExternal + ")";
    $rootScope.instruction = "Using the window icon image, tap and hold to drag it onto the wall to add windows on the external wall. After positioning the windows, scale it to size by tapping and holding the bottom right indicated area of the window that has been placed on the wall";
    $rootScope.bubbleText = "Drag, position and scale the window icon on the wall to tell me how your windows are like";

    $scope.wallWidth = currentRoom.polygon.edges[currentRoom.externalWallsIndexes[currentRoom.currentExternal]].length;
    $scope.wallHeight = currentRoom.ceilingHeight;

    $rootScope.back = function(){
        currentRoom.polygon.edges[currentRoom.externalWallsIndexes[currentRoom.currentExternal]].windows = [];
        
        currentRoom.currentExternal -= 1;
        saveToSessionStorage();
        
        /* if no more wall in the back stack */
        if(currentRoom.currentExternal < 0){
            $location.path("/specify-walls");
        }

        /* go back to wall direction */
        //else if(currentRoom.currentExternal == 0){ // first wall, back to wall direction
        //    $location.path('/wall-direction');
        //}

        /* there's still more wall in back stack */
        else {
            $route.reload();
        }
    }

    $rootScope.cancel = function(){
        $location.path("/house-overview");
    }

    $rootScope.next = function(){
        
        currentRoom.currentExternal += 1;
        saveToSessionStorage();

        /* if first external wall */
        //if(currentRoom.currentExternal == 1){
        //    $location.path("/wall-direction");
        //}

        /* if completed */
        if(currentRoom.currentExternal == currentRoom.noOfExternal){
            $location.path("/wall-direction");
        }

        /* if there're still more walls */
        else {
            $route.reload();
        }
    }
    
    $rootScope.currHelpIdx = 0;
        $scope.helpContents = [
            {
                "description": "Drag the 'Window' icon onto the Wall to add a window",
                "img": "img/help/add-windows-1.gif",
                "className": "index-1"
            },
            {
                "description": "Drag the center area of the window (highlighted in Red) to position the window",
                "img": "img/help/add-windows-2.gif",
                "className": "index-2"
            },
            {
                "description": "Drag one of the edges or corners of the windows to resize",
                "img": "img/help/add-windows-3.gif",
                "className": "index-3"
            },
            {
                "description": "Tap on the window to select/deselect it. Tap 'Duplicate' or 'Remove' to duplicate or remove the selected window respectively",
                "img": "img/help/add-windows-4.gif",
                "className": "index-4"
            },
            {
                "description": "Tap on 'Undo' button to cancel previously operation, e.g. resize, move, duplicate, remove",
                "img": "img/help/add-windows-5.gif",
                "className": "index-5"
            },
            {
                "description": "Tap on 'Redo' button to cancel your previous Undo",
                "img": "img/help/add-windows-6.gif",
                "className": "index-6"
            },
            {
                "description": "Tap on 'Clear' button to clear your wall and start over",
                "img": "img/help/add-windows-7.gif",
                "className": "index-7"
            }
        ];
        
        $scope.currHelp = $scope.helpContents[$rootScope.currHelpIdx];
        
        $scope.nextHelp = function(index){
            $rootScope.currHelpIdx = $rootScope.currHelpIdx + index;
            $scope.currHelp = $scope.helpContents[$rootScope.currHelpIdx];
        }

    $rootScope.controller = 'add-windows';
    jQuery(".next").prop("disabled", false);

}])

/* Room Specs */

.controller('RoomSpecs',['$route', '$scope', '$rootScope', '$location', '$timeout', '$routeParams', function($route, $scope, $rootScope, $location, $timeout, $routeParams) {
 
    var roomNo = $routeParams.id;
    var isCurrent = roomNo === 'current';
    
    $rootScope.currentMascotIdx = 2;

    $rootScope.title = "Recommend me a Daikin";
    if(isCurrent){
    $rootScope.subtitle = "Specifications of the room you have created";
    $rootScope.instruction = "";
    $rootScope.bubbleText = "Tap 'Done' after confirming the inputs entered for the room you have created";
    $rootScope.controller = 'room-specs-current';
    $scope.aRoom = currentRoom;
        
        $rootScope.back = function(){
        
        if(currentRoom.noOfExternal > 0)
            $location.path("/wall-direction");
        else
            $location.path("/specify-walls");
        
    }
        $rootScope.cancel = function(){
        $location.path("/house-overview");
    }

    $rootScope.complete = function(){
        
        rooms.push(currentRoom);
        saveToSessionStorage();
        $location.path("/house-overview");

    }
        
        
    } else {
    $rootScope.subtitle = "Specifications of the room you have created";
    $rootScope.instruction = "";
    $rootScope.bubbleText = "Tap 'Back' to go back to your House Overview";
    $scope.aRoom = rooms[parseInt(roomNo)];
    $rootScope.back = function(){  
        $location.path("/house-overview");
    }
    $rootScope.controller = 'room-specs';
    }
    
    $scope.getDirectionName = getDirectionName;
    
    $timeout(function(){
    var canvasContainer = $(".a-room-canvas");
    if(renderers.length == 0){
      renderers[0] = new THREE.WebGLRenderer({antialias:true, alpha: true});
    }
    
    var renderer = renderers[0];
    var control = init3DRoom($scope.aRoom, canvasContainer,  function(idx, currentLine){
        return gray;
    }, 2, true, renderer);

    function animate(){
        requestAnimationFrame( animate );
        
        control.renderer.render(control.scene, control.camera);
        control.controls.update();

    }
    
    animate();
    });
    jQuery(".next").prop("disabled", false);

}])

/* Ceiling Height */

.controller('CeilingHeight',['$scope', '$rootScope', '$location', function($scope, $rootScope, $location) {
    
    $rootScope.currentMascotIdx = 8;

    $rootScope.title = "Recommend Me a Daikin Aircon"
    $rootScope.subtitle = "What is the height of your room?";
    $rootScope.instruction = "Using the Ceiling Bar, drag it upwards or downwards to specify the height of the ceiling of your room";
    $rootScope.bubbleText = "Drag the Ceiling Bar to tell me the height of your ceiling";
    
    $scope.ceilingHeight = previousCeilingHeight;
    $scope.maxCeilingHeight = CEILING_HEIGHT.MAX;
    $scope.minCeilingHeight = CEILING_HEIGHT.MIN;

    function changeSlide( event, ui ) {
            //parseInt($('.largeField')[0].style.width, 10);
            $(".room-height").css("bottom",parseFloat($(".ui-slider-handle")[0].style.bottom) + "%");
        }

    $scope.slider = {
    'options': {
        change: changeSlide,
        slide: changeSlide,
        orientation: 'vertical',
        range: 'min'
    }
    };

    currentRoom.ceilingHeight = $scope.ceilingHeight;

    $rootScope.back = function(){
        $location.path("/draw-room");
    }

    $rootScope.cancel = function(){
        $location.path("/house-overview");
    }

    $rootScope.next = function(){

        currentRoom.ceilingHeight = $scope.ceilingHeight;
        previousCeilingHeight = currentRoom.ceilingHeight;

        saveToSessionStorage();
        
        $location.path("/specify-walls");

    }

    $rootScope.controller = 'ceiling-height';
    jQuery(".next").prop("disabled", false);

}])

/* Specify Walls */

.controller('SpecifyWalls',['$scope', '$rootScope', '$location', function($scope, $rootScope, $location) {
    
    $rootScope.currentMascotIdx = 3;

    //$rootScope.title = "Recommend Me a Daikin Aircon"
    // $rootScope.subtitle = "Which are the external walls in the room?";
    //$rootScope.instruction = "Definition - External Walls: are walls which face the outside of your house. Internal Walls: are connecting walls between different rooms of your house. Specify the external walls in your room by tapping on any of the walls on the layout shape to mark it in pink color.";
    $rootScope.bubbleText = "Tap the next button to browse other features for this model";
    
    $rootScope.back = function(){
        for(var i=0; i<currentRoom.polygon.edges.length; i++){
            currentRoom.polygon.edges[i].external = false;
        }
        currentRoom.externalWallsIndexes = [];
        currentRoom.noOfExternal = 0;
        
        saveToSessionStorage();
        $location.path("/ceiling-height");
    }

    $rootScope.cancel = function(){
        $location.path("/house-overview");
    }

    $rootScope.next = function(){
        if(currentRoom.noOfExternal > 0)
            currentRoom.currentExternal = 0;

        currentRoom.externalWallsIndexes = [];
        for(var i=0; i<currentRoom.polygon.edges.length; i++){
            if(currentRoom.polygon.edges[i].external){
                currentRoom.externalWallsIndexes.push(i);
            }
        }
        
        if(currentRoom.noOfExternal > 0){
            saveToSessionStorage();
            $location.path("/add-windows");
        }
        else{
            //rooms.push(currentRoom);
            saveToSessionStorage();
            $location.path("/room-specs/current");
        }
    }

    $rootScope.controller = 'specify-walls';
    jQuery(".next").prop("disabled", false);

}])

;
