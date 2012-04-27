// subdomain XSF workaround
document.domain = "openplans.org";

$(function() {
  var throttledVoteCallback = (function() {
    var done = true;
    return function(submitEvent, target){
      submitEvent.preventDefault();
      
      if (done) {
        done = false;
        var $form = $(submitEvent.target);
        
        $.ajax( {
          url         : $form.attr("action"), 
          data        : $form.serialize(), 
          type        : 'POST',
          dataType    : "json",
          crossDomain : true
        }).complete(function(data) {   
          var responseJSON = eval('(' + data.responseText + ')');      
          done = true; 
          $("#popup").html(responseJSON.view);
        }); 
      }
    };
  })();
  
  var closePopup = function(clickEvent) {
    clickEvent.preventDefault();
    $("#popup").removeClass("visible");
    window.map.mapWrap("resetState");
  };
  
  // When map has been loaded, save shareabouts map to local window var
  $("#shareabouts iframe").ready(function(){
    var intervalId = window.setInterval(function(){
      try {
        if (window.map.mapLoaded) {
          window.clearInterval(intervalId);
        };
      } catch(err) {
        window.clearInterval(intervalId);
      }
    },500);
  });
  
  $("#new_vote").live("submit", throttledVoteCallback);
  $("#popup .close").live("click", closePopup);
});


