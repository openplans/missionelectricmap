// subdomain XSF workaround
document.domain = "openplans.org";

$(function() {
  // Throttles vote, and performs request, loads in popup
  var throttledVoteCallback = (function() {
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
  
  var closePopup = function(clickEvent) {
    clickEvent.preventDefault();
    $("#popup").removeClass("visible");
    window.map.mapWrap("resetState");
  };
  
  // When map has been loaded, save shareabouts map to local window var
  $("#shareabouts iframe").ready(function(){
    var intervalId = window.setInterval(function(){
      try {
        if (window.map.mapLoaded) window.clearInterval(intervalId);
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


