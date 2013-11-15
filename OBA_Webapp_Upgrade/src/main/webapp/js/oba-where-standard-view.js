var oba_where_standard_view = function (data) {

    var defaultRoute = data.args.route;
    var map = data.map;
    var mapPanel = $("#map");
    var resultPanel = $("#searchresults");
    var markerManager = OBA.Maps.markerManager(map);
    var infoWindow = new google.maps.InfoWindow();
    var searchData = {};    
    var defaultLat = 47.606828;
    var defaultLon = -122.332505;    
    var queryLat = (data.args.qll ? data.args.qll.split(",")[0] : defaultLat);
    var queryLon = (data.args.qll ? data.args.qll.split(",")[1] : defaultLon);
    var centerLat = (data.args.ll ? data.args.ll.split(",")[0] : defaultLat);
    var centerLon = (data.args.ll ? data.args.ll.split(",")[1] : defaultLon);
    var zoom = (data.args.zoom || 12);
    
    var setCurrentView = function()
    {
    
      // set the initial map view if specified in the querystring args
      if(data.args.ll)
      {
        map.setCenter(new google.maps.LatLng(centerLat,centerLon))
        map.setZoom(parseFloat(zoom))
      }
      else
      {
        map.setCenter(new google.maps.LatLng(defaultLat,defaultLon))
        map.setZoom(parseFloat(zoom));        
      }
      
      // clear the search results
      clearSearchResults();
      
      if(data.args.m == "query")
      {
        // handle search mode
        getRoutes();
        getStops();
        getAddresses(); 
        getPlaces();
      }
      else if(data.args.m == "route")
      {
        // handle route mode
        OBA.Api.route(data.args.route, function(route){
          resultPanel.append("<div><a class=\"clearsearchlink\" href=\"\">Clear this search</a></div>");
          routeResultHandler(route, 0);
          OBA.Api.stopsForRoute(route.id, stopsForRouteHandler);        
        });
      }
      else if(data.args.m == "location")
      {
        // handle locaton mode
        var params = {};
        params.lat = Number(data.args.lat);
        params.lon = Number(data.args.lon);
        OBA.Api.stopsForLocation(params, function(data){        
          var bounds = new google.maps.LatLngBounds();		
          jQuery.each(data.list, function(index) {
            stopIconHandler(this, index);
            bounds.extend(new google.maps.LatLng(this.lat,this.lon));
          });          
          if( ! bounds.isEmpty()&& ! data.mapviewset)
          {
            map.fitBounds(bounds);       
          }          
          var m = new google.maps.Marker({
            position : new google.maps.LatLng(params.lat, params.lon),
            map: map
          });
        });
      }
      else
      {
        // default
        $("#defaultsearchresults").show();
      }
      
    }

    var getRoutes = function()
    {
        var params = {};
        params.lat = Number(queryLat);
        params.lon = Number(queryLon);
        params.radius = 20000;
        params.query = data.args.q;
        OBA.Api.routesForLocation(params, function(data){
          searchData.routes = data;
          showSearchResults();        
        });
    };

    var getStops = function()
    {
        var params = {};
        params.lat = Number(queryLat);
        params.lon = Number(queryLon);
        params.radius = 20000;
        params.query = data.args.q;
        OBA.Api.stopsForLocation(params, function(data){
          searchData.stops = data;
          showSearchResults();        
        });
    };

    var getAddresses = function()
    {
        var geosvc = new google.maps.Geocoder();
        var params = {
          "address" : data.args.q,
          bounds : getBounds(Number(queryLat), Number(queryLon))
        }
        geosvc.geocode(params, function(data, status){
          searchData.addresses = data;
          showSearchResults();
        });
    };

    var getPlaces = function()
    {
        var plcsvc = new google.maps.places.PlacesService(map);
        var params = {
          name : data.args.q,
          location : new google.maps.LatLng(queryLat, queryLon),
          sensor : "false",
          radius : "2000"
        }
        plcsvc.nearbySearch(params, function(data, status){
          searchData.places = data;
          showSearchResults();
        });
    };
    
    var showSearchResults = function()
    {
    
      // show the results once we have all the data
      if(searchData.addresses != null && 
        searchData.places != null &&
        searchData.routes != null &&
        searchData.stops != null)
      {

        resultPanel.append("<div><a class=\"clearsearchlink\" href=\"\">Clear this search</a></div>");

        // render the route search results
        if(searchData.routes.list.length > 0 )
        {
          jQuery.each(searchData.routes.list, function(index) {      
            routeResultHandler(this, index);        
          });
        
          // show the route on the map
          if(data.args.show == null || data.args.show == "route")
          {
            OBA.Api.stopsForRoute(searchData.routes.list[0].id, stopsForRouteHandler);
          }
          
          // set the first route as the default for stop.action
          defaultRoute = searchData.routes.list[0].id;
        }
        
        // show alternate results header
        if(searchData.routes.list.length > 0 && (searchData.stops.list.length + searchData.addresses.length + searchData.places.length > 0))
        {
          resultPanel.append("<div class=\"didyoumean\">Did you mean:</div>");
        }
        
        // render the stop search results
        if(searchData.stops.list.length > 0)
        {
          resultPanel.append("<div class=\"resultshead\">Stops:</div>");
          jQuery.each(searchData.stops.list, function(index) {      
            stopResultHandler(this, index);        
          });
        }                
                
        // render the address search results
        if(searchData.addresses.length > 0)
        {
          if(searchData.routes.list.length > 0)
          {
            resultPanel.append("<div class=\"resultshead\">Addresses:</div>");
          }
          jQuery.each(searchData.addresses, function(index) {
            addressResultHandler(this, index);
          });
          
          // show the stops for this location on the map if no route is displayed
          if(data.args.show == null && searchData.routes.list.length == 0)
          {
            map.setCenter(searchData.addresses[0].geometry.location);
            var lat = searchData.addresses[0].geometry.location.lat();
            var lon = searchData.addresses[0].geometry.location.lng();
            OBA.Api.stopsForLocation({"lat" : lat, "lon" : lon}, stopsForLocationHandler);
          }
          
          // show all of the addresses on the map if show addresses arg is present [NOTE - NOT YET ENABLED]
          if(data.args.show != null && data.args.show == "addresses")
          {
            var bounds = new google.maps.LatLngBounds();		
            jQuery.each(searchData.addresses, function(index) {
              bounds.extend(new google.maps.LatLng(this.geometry.location.lat(),this.geometry.location.lng()));
              var m = new google.maps.Marker({
                position : new google.maps.LatLng(this.geometry.location.lat(), this.geometry.location.lng()),
                map: map
              });
            });          
            if( ! bounds.isEmpty()&& ! data.mapviewset)
            {
              //map.fitBounds(bounds);       
            }          
            
            var url = buildURL(data.args,null,{"show":true});
            resultPanel.append("<div style=\"margin-top:10px;margin-left:10px;\"><a id=\"show-all-addr\" class=\"gwt-anchor\" style=\"font-size:13px;\" href=\"javascript:location.href='" + url + "';location.reload()\">Hide all on map</a></div>");
            
          }
          else
          {
            var url = buildURL(data.args,{"show":"addresses"},null);
            //resultPanel.append("<div style=\"margin-top:10px;margin-left:10px;\"><a id=\"show-all-addr\" class=\"gwt-anchor\" style=\"font-size:13px;\" href=\"javascript:location.href='" + url + "';location.reload()\">Show all on map</a></div>");
          }
        }    
          
        // render the place search results
        if(searchData.places.length > 0)
        {
          resultPanel.append("<div class=\"resultshead\">Places:</div>");    
          jQuery.each(searchData.places, function(index) {
            placeResultHandler(this, index);
          });
        }    

      }
        
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

   var stopsForLocationHandler = function (stopsForLocation) {

   // add the stop icons
      var bounds = new google.maps.LatLngBounds();		
      jQuery.each(stopsForLocation.list, function(index) {
        stopIconHandler(this, index);
        bounds.extend(new google.maps.LatLng(this.lat,this.lon));
      });
      
      if( ! bounds.isEmpty()&& ! data.mapviewset)
        map.fitBounds(bounds);
      
    };    
    
    var routeResultHandler = function (route, index) {
    
        var url = buildURL({"m":"route","route":route.id});
        resultPanel.append("<div class=\"searchresult" + (index == 0 ? " firstresult" : "") + "\">" +
          "<div><a class=\"searchresultlink\" href=\"javascript:location.href='" + url + "';location.reload()\">" + route.shortName + " - " + route.description + "</a></div>" +
          "<div class=\"searchresultdescription\">Operated by <a class=\"agencylink\" href=\"" + route.agency.url + "\">" + route.agency.name + "</a></div>" +
          "</div>");        
    };
    
    var stopResultHandler = function (stop, index) {
        resultPanel.append("<div class=\"searchresult\">" + 
          "<div><a class=\"searchresultlink\" href=\"stop.action?id=" + stop.id + "\">" + stop.name + "</a></div>" +
          "<div class=\"searchresultdescription\">Stop # " + stop.code + (stop.direction != "" ? " - " + stop.direction + " bound" : "") + "</div>" +
          "</div>");
    };
    
    var addressResultHandler = function(address, index)
    {
        var url = buildURL({"m":"location","lat" : address.geometry.location.lat() , "lon": address.geometry.location.lng()});
        resultPanel.append("<div class=\"searchresult" + (index == 0 && searchData.routes.list.length == 0 ? " firstresult" : "") + "\">" +
          "<div><a class=\"searchresultlink\" href=\"javascript:location.href='" + url + "';location.reload()\">" + address.address_components[0].long_name + "</a></div>" +
          "<div class=\"searchresultdescription\">" + address.formatted_address + "</div>" +
          "</div>" +
          "</div>");
    };
    
    var placeResultHandler = function(place, index)
    {
        resultPanel.append("<div class=\"searchresult\">" +
          "<div><a class=\"searchresultlink\" href=\"\">" + place.name + "</a></div>" +
          "<div class=\"searchresultdescription\">" + place.vicinity + "</a></div>" +
          "</div>");
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
                if(defaultRoute != null)
                {
                  params.route = defaultRoute;
                }
                url += OBA.Common.buildUrlQueryString(params);
                anchor.attr("href", url);
                
                var anchor = content.find(".stopContent>p>a:nth-child(3)");
                var url = anchor.attr("href");
                var params = {};
                params.id = stop.id;
                url += OBA.Common.buildUrlQueryString(params);
                anchor.attr("href", url);
                
                infoWindow.setOptions({"maxWidth": 260})
                infoWindow.setContent(content.show().get(0));
                infoWindow.open(map, this);
            });
        });
    };

    /**
    * Utility functions
    */

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
      resultPanel.html("");
      $("#defaultsearchresults").hide();
    };
    
    // render the view
    setCurrentView();
   
};