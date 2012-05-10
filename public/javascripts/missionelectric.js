// subdomain XSF workaround
document.domain = "openplans.org";

jQuery(function($) {

  var popup = $("#popup");

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
  
  var popupContent = function(content, section) {
    var target = popup;
    if (section) target = popup.find(section);

    target.html(content);
    target.find("label.required").append( $("<span>").addClass("required").html("*") );
    target.find("input:text, textarea").each(function(){
      if (this.value.trim().length > 0) popup.find("label[for=" + $(this).attr("id") + "]").hide();
    });
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
    
        ajaxOptions = {
          url         : $form.attr("action"), 
          type        : 'POST',
          dataType    : "json",
          crossDomain : true,
          success : function(data) {   
            perform = true; 
            var responseJSON = eval('(' + data.responseText + ')');
            
            popupContent(responseJSON.view); // replacing entire popup contents here
            if (data.responseText.search(/field_with_error/) == -1) {
              window.map.mapWrap("finalizeNewFeature");
            }
          }
        };
        
        var data = $(":text, textarea, select, :hidden", $form).serializeArray();        
        data.push({name: "latitude", value: latlng.lat})
        data.push({name: "longitude", value: latlng.lng})
        
        ajaxOptions.iframe=  true;
        ajaxOptions.processData =false;
        ajaxOptions.files =$(":file", $form);
        ajaxOptions.data = data;
          
        $.ajax(ajaxOptions);
        
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
            if ( popup.find("#right .new_comment").length == 0 ) popupContent(data.view, "#right");
          }
        });
        
        // if the new comment form has been loaded (after the location info was loaded), show it
        // currently disabling so that we can pass the vote id to comment form to update agent name in ticker
        // if ( window.map.mapWrap("getNewCommentForm") ) window.map.mapWrap("showNewComment");
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
            popupContent(data.view, "#right");
            
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
        popupContent(data.view, "#right");
      }
    });
  };
  
  // Closes the popup and resets the map state
  var closePopup = function(clickEvent) {
    clickEvent.preventDefault();
    popup.removeClass("visible");
    window.map.mapWrap("resetState");
  };
  
  var loadFeatureFromParams= function(){
    var hrefParts = window.location.href.split("#");
    if (hrefParts.length < 2) return;
    
    var locationParts = hrefParts[1].split("/");
    if (locationParts.length < 2) return;
    
    window.map.mapWrap("viewFeature", parseInt(locationParts[1], 10));
  };
  
  // Callback for when map has loaded
  // Fires place open if location is specified
  var afterMapLoad = function() {
    loadFeatureFromParams();
    
    var locate_feature = $("#locate_feature", frames["map"].document);
    locate_feature.click( function(event) {
      window.map.mapWrap("locateNewFeature", {
        url :  [iframeSrc, "/locations/new"].join(""),
        success: function(data){
          popupContent(data.view)
        }
      });
      $(this).hide();    
    });
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
  
  $("#popup input:text, #popup textarea").live("input propertychange", function(){
    var label = popup.find("label[for=" + $(this).attr("id") + "]");
    if (this.value.trim().length > 0) label.hide();
    else label.show();
  });
  
  $("#new_vote").live("submit", throttledVoteCallback);
  $("#new_feature_point").live("submit", throttledPointCallback);
  $("#new_comment").live("submit", throttledCallback);
  popup.find(".close").live("click", closePopup);
  popup.find("a[data-behavior=load_result_in_popup]").live("click", loadLinkInPopup);
  
  
  $("#eventfeed").each(function(){
    var container = $(this);
    $.ajax( {
      url         : [iframeSrc, "/locations/events"].join(""), 
      type        : 'GET',
      dataType    : "json",
      crossDomain : true,
      success : function(data) {
        if (data.view) {
          container.append( $("<h5>").html("Event List"));
          container.append(data.view);
          container.find("a[data-feature-id]").click(function(e){
            e.preventDefault();
            window.map.mapWrap("viewFeature", $(this).data("feature-id"));
            $('html, body').animate({scrollTop:150}, 'slow');
          });
        }
      }
    });
  });
});


