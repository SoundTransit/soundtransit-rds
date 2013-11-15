var oba_where_standard_query = function (data) {

    // TODO: handle location display [#m(location)]

    // TODO: handle click to display result on map
    
    // TODO: handle show all/hide all on map
    
    // TODO: handle default location display and sidebar text

    // TODO: implement set default location overlay
    
    // TODO: handle clear search (behavior to match live site)
    
    
    var params = {};
    params.lat = Number(data.lat);
    params.lon = Number(data.lon);
    params.radius = 20000;
    params.query = data.q;
    
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
    
        // clear the search results
        clearSearchResults();
        routeResultPanel.append("<div><a class=\"clearsearchlink\" href=\"\">Clear this search</a></div>");
        stopResultPanel.append("<div class=\"didyoumean\">Did you mean:</div>");
        stopResultPanel.append("<div class=\"resultshead\">Stops:</div>");
        addressResultPanel.append("<div class=\"resultshead\">Addresses:</div>");
        placeResultPanel.append("<div class=\"resultshead\">Places:</div>");
                
        // get the stop results
        OBA.Api.stopsForLocation(params, stopsForLocationHandler);

        // get the route results
        OBA.Api.routesForLocation(params, routesForLocationHandler);

        // get address results
        var geosvc = new google.maps.Geocoder();
        var googleparams = {
          "address" : params.query,
          bounds : getBounds(params.lat, params.lon)
        }
        geosvc.geocode(googleparams, function(data, status){
          
          jQuery.each(data, function(index) {
            addressResultHandler(this, index);
          });
        });
        
        // get place results 
        var plcsvc = new google.maps.places.PlacesService(map);
        var googleparams = {
          name : params.query,
          location : new google.maps.LatLng(params.lat, params.lon),
          sensor : "false",
          radius : "2000"
        }
        plcsvc.nearbySearch(googleparams, function(data, status){
          jQuery.each(data, function(index) {
            placeResultHandler(this, index);
          });
        });
        

    });

    var stopsForLocationHandler = function (stopsForLocation) {
    	if(!stopsForLocation.list)
    		return;

      var bounds = new google.maps.LatLngBounds();		
      jQuery.each(stopsForLocation.list, function(index) {
      
        // add the result to the results list
        stopResultHandler(this, index);
        
      });
      
    };
    
    var routesForLocationHandler = function (routesForLocation) {
    	if(!routesForLocation.list)
    		return;

      jQuery.each(routesForLocation.list, function(index) {
        // add the result to the results list
        routeResultHandler(this, index);        
      });      
      
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
      });
      
      // add the stop icons
      var bounds = new google.maps.LatLngBounds();		
      jQuery.each(stopsForRoute.stops, function(index) {
        stopIconHandler(this, index);
        bounds.extend(new google.maps.LatLng(this.lat,this.lon));
      });
      
      if( ! bounds.isEmpty()&& ! data.mapviewset)
        map.fitBounds(bounds);
      
    };    
    
    var routeResultHandler = function (route, routeSequence) {
        var url = buildURL({"m":"route","route":route.id});
        routeResultPanel.append("<div class=\"routeresult\">");
        routeResultPanel.append("<div><a class=\"routelink\" href=\"javascript:location.href='" + url + "';location.reload()\">" + route.shortName + " - " + route.description + "</a></div>")
        routeResultPanel.append("<div class=\"routedescription\">Operated by <a class=\"agencylink\" href=\"" + route.agency.url + "\">" + route.agency.name + "</a></div>");
        routeResultPanel.append("</div>");
        
        if(routeSequence ==0)
        {
          OBA.Api.stopsForRoute(route.id, stopsForRouteHandler);
        }
    };
    
    var stopResultHandler = function (stop, stopSequence) {
        stopResultPanel.append("<div class=\"stopresult\">");
        stopResultPanel.append("<div><a class=\"stoplink\" href=\"stop.action?id=" + stop.id + "\">" + stop.name + "</a></div>");
        stopResultPanel.append("<div class=\"stopdescription\">Stop # " + stop.code + (stop.direction != "" ? " - " + stop.direction + " bound" : "") + "</div>");
        stopResultPanel.append("</div>");
    }
    
    var addressResultHandler = function(address, addressSequence)
    {
        addressResultPanel.append("<div class=\"addressresult\">");
        addressResultPanel.append("<div><a class=\"addresslink\" href=\"\">" + address.address_components[0].long_name + "</div>");
        addressResultPanel.append("<div class=\"addressdescription\">" + address.formatted_address + "</div>");
        addressResultPanel.append("</div>");
        addressResultPanel.append("</div>");
    };
    
    var placeResultHandler = function(place, placeSequence)
    {
        placeResultPanel.append("<div class=\"placeresult\">");
        placeResultPanel.append("<div><a class=\"placelink\" href=\"\">" + place.name + "</a></div>")
        placeResultPanel.append("<div class=\"placedescription\">" + place.vicinity + "</a></div>");
        placeResultPanel.append("</div>");
    };
    
    
   /**
	 * Create map markers for a stop and a pop-up info window for display when clicked
	 */
    var stopIconHandler = function (stop, stopSequence) {

        var markers = OBA.Maps.addStopToMarkerManager(stop, markerManager);

        jQuery.each(markers, function () {
            google.maps.event.addListener(this, 'click', function () {
                var content = OBA.Presentation.createStopInfoWindow(stop);

                var anchor = content.find(".stopContent>p>a:nth-child(1)");
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

    var getBounds = function (ctrlat, ctrlon)
    {
      var northEast = getNewCoord(ctrlat, ctrlon, 45, 2000);
      var southWest = getNewCoord(ctrlat, ctrlon, 225, 2000);
      return new google.maps.LatLngBounds(southWest, northEast);
    };
    
    var getNewCoord = function(lat, lng, brng, dist) 
    {
      var radius = 6371000;
      dist = dist / radius;
      brng = brng.toRad();  
      var lat1 = lat.toRad(),
          lon1 = lng.toRad();
      var lat2 = Math.asin(Math.sin(lat1) * Math.cos(dist) +
          Math.cos(lat1) * Math.sin(dist) *
          Math.cos(brng));
      var lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(dist) *
          Math.cos(lat1), Math.cos(dist) -
          Math.sin(lat1) * Math.sin(lat2));
      lon2 = (lon2 + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
      return new google.maps.LatLng(lat2.toDeg(), lon2.toDeg());      
    };    
    
    var clearSearchResults = function() {
      stopResultPanel.html("");
      routeResultPanel.html("");
      placeResultPanel.html("");
      addressResultPanel.html("");
    };
   
};