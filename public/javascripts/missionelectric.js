// subdomain XSF workaround
document.domain = "openplans.org";

jQuery(function($) {

  if(typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function() {
      return this.replace(/^\s+|\s+$/g, ''); 
    }
  }

  var iframeSrc = $("iframe[name=map]").attr("src");
  $("#ticker").activityticker({
    url   : [iframeSrc, "/activity"].join(""),
    limit : 5, 
    click : function(e, ui) {
      e.preventDefault();
      window.map.mapWrap("viewFeature", ui.featureId);
      $('html, body').animate({scrollTop:150}, 'slow');
    }
  });
  
  var latLngToQueryString = function(latlng) {
    return "latitude=" + latlng.lat + "&longitude=" + latlng.lng;
  };
  
  // TODO dry all these submit callbacks up  
  var throttledPointCallback = (function() {    
    var perform = true;
    return function(submitEvent, target){
      submitEvent.preventDefault();

      if (perform) {
        perform = false;
        var newFeature = window.map.mapWrap("getNewFeatureMarker"),
            latlng     = newFeature._visible ? newFeature.getLatLng() : window.map.mapWrap("getMap").getCenter(),
            latLngStr  = latLngToQueryString(latlng);

        // $.getJSON([iframeSrc, "/locations/within_region"].join(""), latLngStr, function(data){
        //   if (!data || data.status != "error") { // Location is good
           // submit new feature
        var $form = $(submitEvent.target);
         
        $.ajax({
          url         : $form.attr("action"), 
          data        : $form.serialize() + "&" + latLngStr, 
          type        : 'POST',
          dataType    : "json",
          crossDomain : true,
          success : function(data) {   
            perform = true; 
            $("#popup").html(data.view); // replacing entire popup contents here
            if (data.status != "error") {
              window.map.mapWrap("finalizeNewFeature");
            }
          }
        });
        //   } else window.map.mapWrap("showHint", data.message, newFeature);
        // })
      }
    };
  })();

  
  // Throttles vote, and performs request, loads in popup
  var throttledVoteCallback = (function() {
    var perform = true;
    return function(submitEvent, target){
      submitEvent.preventDefault();
      
      if (perform) {
        perform = false;
        var $form = $(submitEvent.target).hide();
                
        $.ajax( {
          url         : $form.attr("action"), 
          data        : $form.serialize(), 
          type        : 'POST',
          dataType    : "json",
          crossDomain : true,
          success : function(data) {   
            perform = true; 
            
            // If new comment form has not yet been rendered, render returned form now
            if ( $("#popup #right .new_comment").length == 0 ) $("#popup #right").html(data.view);
          }
        });
        
        // if the new comment form has been loaded (after the location info was loaded), show it
        if ( window.map.mapWrap("getNewCommentForm") ) window.map.mapWrap("showNewComment");
      }
    };
  })();
  
  // Throttles an ajax post, 
  // currently for comment form submit
  var throttledCallback = (function() {
    var perform = true;
    return function(submitEvent, target){
      submitEvent.preventDefault();
      
      if (perform) {
        perform = false;
        var $form = $(submitEvent.target);
        
        $.ajax( {
          url         : $form.attr("action"), 
          data        : $form.serialize(), 
          type        : 'POST',
          dataType    : "json",
          crossDomain : true,
          success : function(data) {   
            perform = true; 
            $("#popup #right").html(data.view);
            if (data.status != "error") {
              window.map.mapWrap("viewFeature");
            }
          }
        });
      }
    };
  })();
  
  // Loads the resulting data.view in the popup
  var loadLinkInPopup = function(clickEvent) {

    clickEvent.preventDefault();
    
    $.ajax( {
      url         : $(clickEvent.target).attr("href"), 
      type        : 'GET',
      dataType    : "json",
      crossDomain : true,
      success : function(data) {   
        perform = true; 
        $("#popup #right").html(data.view);
      }
    });
  };
  
  // Closes the popup and resets the map state
  var closePopup = function(clickEvent) {
    clickEvent.preventDefault();
    $("#popup").removeClass("visible");
    window.map.mapWrap("resetState");
  };
  
  // Callback for when map has loaded
  // Fires place open if location is specified
  var afterMapLoad = function() {
    var hrefParts = window.location.href.split("#");
    if (hrefParts.length < 2) return;
    
    var locationParts = hrefParts[1].split("/");
    if (locationParts.length < 2) return;
    
    window.map.mapWrap("viewFeature", parseInt(locationParts[1], 10)); 
  };
  
  // Calls afterMapLoad when map is ready
  $("#shareabouts iframe").ready(function(){
    var intervalId = window.setInterval(function(){
      try {
        if ( $("iframe[name=map]").attr("loaded") ) { 
          window.clearInterval(intervalId);
          afterMapLoad();
        }
      } catch(err) {
        window.clearInterval(intervalId);
      }
    },500);
  });
  
  $("#new_vote").live("submit", throttledVoteCallback);
  $("#new_feature_point").live("submit", throttledPointCallback);
  $("#new_comment").live("submit", throttledCallback);
  $("#popup .close").live("click", closePopup);
  $("#popup a[data-behavior=load_result_in_popup]").live("click", loadLinkInPopup);
  $("#eventfeed").each(function(){
    var container = $(this);
    $.ajax( {
      url         : [iframeSrc, "/locations/events"].join(""), 
      type        : 'GET',
      dataType    : "json",
      crossDomain : true,
      success : function(data) {   
        container.html(data.view);
        container.find("a[data-feature-id]").click(function(e){
          e.preventDefault();
          window.map.mapWrap("viewFeature", $(this).data("feature-id"));
          $('html, body').animate({scrollTop:150}, 'slow');
        });
      }
    });
  });
});


