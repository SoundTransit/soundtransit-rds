var oba_where_standard_route = function (data) {

    var params = {};
    params.routeId = data.routeId;

    var map = data.map;
    var mapPanel = data.mapElement;
    var resultPanel = data.resultsElement;
    var markerManager = OBA.Maps.markerManager(map);
    var infoWindow = new google.maps.InfoWindow();
    var vehicleLocationMarker = null;
    
    var stopResultPanel = resultPanel.find("#stopsearchresults");        
    var routeResultPanel = resultPanel.find("#routesearchresults");    
    var placeResultPanel = resultPanel.find("#placesearchresults");        
    var addressResultPanel = resultPanel.find("#addresssearchresults");      
    
    OBA.Maps.mapReady(map, function () {

        clearSearchResults();
        
        routeResultPanel.append("<div><a class=\"clearsearchlink\" href=\"\">Clear this search</a></div>");
        
        OBA.Api.route(params.routeId, routeHandler);
        OBA.Api.stopsForRoute(params.routeId, stopsForRouteHandler);
    });

    
    var routeHandler = function (route) {
        var url = buildURL({"m":"route","route":route.id});
        routeResultPanel.append("<div class=\"routeresult\">");
        routeResultPanel.append("<div><a class=\"routelink\" href=\"javascript:location.href='" + url + "';location.reload()\">" + route.shortName + " - " + route.description + "</a></div>")
        routeResultPanel.append("<div class=\"routedescription\">Operated by <a class=\"agencylink\" href=\"" + route.agency.url + "\">" + route.agency.name + "</a></div>");
        routeResultPanel.append("</div>");
    };

    var stopsForRouteHandler = function (stopsForRoute) {
      if(!stopsForRoute.polylines)
            return;
            
      // draw the route shape
      jQuery.each(stopsForRoute.polylines, function(index) {
        var path = OBA.Maps.decodePolyline(this.points);
        var opts = { path: path, strokeColor: '#4F64BA' };
        var line = new google.maps.Polyline(opts);
        line.setMap(map);

        /*
        if (path.length > 1) {
            var startPoint = path[0];
            var startIconUrl = OBA.Resources.Map['RouteStart.png'];
            new google.maps.Marker({ position: startPoint, map: map, icon: startIconUrl, clickable: false });

            var endPoint = path[path.length - 1];
            var endIconUrl = OBA.Resources.Map['RouteEnd.png'];
            new google.maps.Marker({ position: endPoint, map: map, icon: endIconUrl, clickable: false });
        }
        */        
      });
      
      // add the stop icons
      var bounds = new google.maps.LatLngBounds();
		
      jQuery.each(stopsForRoute.stops, function(index) {
        stopHandler(this, index);
        bounds.extend(new google.maps.LatLng(this.lat,this.lon));
      });
      
      if( ! bounds.isEmpty() )
        map.fitBounds(bounds);      
      
    };
    
    
   /**
	 * Create map markers for a stop and a pop-up info window for display when clicked
	 */
    var stopHandler = function (stop, stopSequence) {

        var markers = OBA.Maps.addStopToMarkerManager(stop, markerManager);

        jQuery.each(markers, function () {
            google.maps.event.addListener(this, 'click', function () {
                var content = OBA.Presentation.createStopInfoWindow(stop);

                var anchor = content.find(".stopContent p a:nth-child(1)");
                var url = anchor.attr("href");
                var params = {};
                params.id = stop.id;
                params.route = data.routeId;
                url += OBA.Common.buildUrlQueryString(params);
                anchor.attr("href", url);
                
                var anchor = content.find(".stopContent>p>a:nth-child(3)");
                var url = anchor.attr("href");
                var params = {};
                params.id = stop.id;
                url += OBA.Common.buildUrlQueryString(params);
                anchor.attr("href", url);
                
                infoWindow.setContent(content.show().get(0));
                infoWindow.open(map, this);
            });
        });
    };

    var clearSearchResults = function() {
      stopResultPanel.html("");
      routeResultPanel.html("");
      placeResultPanel.html("");
      addressResultPanel.html("");
    };

    
};