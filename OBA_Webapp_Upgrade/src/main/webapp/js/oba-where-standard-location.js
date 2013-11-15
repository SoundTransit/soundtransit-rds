var oba_where_standard_location = function (data) {

    var params = {};

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
        OBA.Api.stopsForLocation(params, stopsForLocationHandler);
    });

    var stopsForLocationHandler = function (stopsForLocation) {
    	if(!stopsForLocation.list)
    		return;

      var bounds = new google.maps.LatLngBounds();		
      jQuery.each(stopsForLocation.list, function(index) {
      
        // add the result to the results list
        stopHandler(this, index);
        
      });
      
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