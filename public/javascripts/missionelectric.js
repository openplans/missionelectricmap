// subdomain XSF workaround
document.domain = "openplans.org";

$(function() {
  
  var iframeSrc = $("iframe[name=map]").attr("src");
  
  // temp for dev, pull in the two scripts with getScript
  $.getScript([iframeSrc, "/javascripts/jquery-ui-1.8.18.custom.min.js"].join(""), function(data, textStatus, jqxhr) {
     $.getScript([iframeSrc, "/javascripts/jquery.activityticker.js"].join(""), function(data, textStatus, jqxhr) {
       $("#ticker").activityticker({
         url   : [iframeSrc, "/activity"].join(""),
         limit : 5, 
         click : function(e, ui) {
           e.preventDefault();
           window.map.mapWrap("viewFeature", ui.featureId);
         }
       });
     });
  });
  
  
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
  
  // Throttles an ajax post
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
          }
        });
      }
    };
  })();
  
  // Loads the resulting data.view in the popup
  var loadLinkInPopup = function(clickEvent) {
    console.log(clickEvent)
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
  $("#new_comment").live("submit", throttledCallback);
  $("#popup .close").live("click", closePopup);
  $("#popup a[data-behavior=load_result_in_popup]").live("click", loadLinkInPopup);
});


