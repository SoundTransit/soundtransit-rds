// prototypes for map geometry handling
if (typeof(Number.prototype.toRad) === "undefined") {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }
}

if (typeof(Number.prototype.toDeg) === "undefined") {
  Number.prototype.toDeg = function() {
    return this * 180 / Math.PI;
  }
}

// utility functions
function setCurrentViewLink(map, args)
{
    var latlon = map.getCenter();
    var bounds = map.getBounds();   
    var zoom = map.getZoom();   
    var params = args;
    params.ll=latlon.lat() + "," + latlon.lng();
    params.zoom=zoom;
    //params.bounds=(bounds.getSouthWest().lat() + "," + bounds.getSouthWest().lng()) + "|" + (bounds.getNorthEast().lat() + "," + bounds.getNorthEast().lng())
    $("#currentviewlink").attr("href",buildURL(params));        
}    

function sizeWindow()
{
    var mapPanel = $("#map");
    var resultPanel = $("#searchresults");
    mapPanel.height($(window).height()-140);
    mapPanel.width($(window).width()-288);
    resultPanel.height(mapPanel.height());
}

function buildURL(urlparams, append, exclude) {
    
    var params = {};
    jQuery.each(urlparams, function(key, value) {
      if(exclude && !exclude[key])
      {
        params[key]=value;
      }
      else if(!exclude)
      {
        params[key]=value;
      }
    });

    if(append)
    {
      jQuery.each(append, function(key, value) {
        if(exclude && !exclude[key])
        {
          params[key]=value;
        }
        else if(!exclude)
        {
          params[key]=value;
        }
      });
    }
    
    var url = "#m" + "(" + params.m + ")";
    if(params.m=="route")
    {
      url+="route(" + params.route + ")";
    }
    
    if(params.m=="query")
    {
      url+="q(" + encodeURIComponent(params.q) + ")";
      url+="qll(" + params.qll + ")";        
    }      

    if(params.lat != null)
    {
      url+="lat(" + params.lat + ")";        
    }
    
    if(params.lon != null)
    {
      url+="lon(" + params.lon + ")";        
    }
    
    if(params.ll != null)
    {
      url+="ll(" + params.ll + ")";        
    }
    
    if(params.bounds != null)
    {
      url+="bounds(" + params.bounds + ")";        
    }
    
    if(params.zoom != null)
    {
      url+="zoom(" + params.zoom + ")";        
    }
    
    if(params.show != null)
    {
      url+="show(" + params.show + ")";        
    }
    
    return url;
}

function parseURL(url)
{
	var params = {};
  var argstring = url.substring(url.indexOf("#") + 1);
  var tokens = argstring.split(")");
  $.each(tokens, function(index) {
    tk = this.split("(");
    params[tk[0]] = decodeURIComponent(tk[1]);
  });
  
  return params;

}

