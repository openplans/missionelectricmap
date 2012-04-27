// subdomain XSF workaround
document.domain = "openplans.org";

if (window.console) window.console.log("hello from shareabouts");

// marker click, show something in the popup

$(function() {
  var throttledVoteCallback = (function() {
    var done = true;
    return function(submitEvent, target){
      submitEvent.preventDefault();
      
      if (done) {
        done = false;
        var $form = $(submitEvent.target),
            $button = $('button', $form),
            $label = $('.vote-label', $form.closest(".feature")),
            votes = parseInt($label.text(), 10);
        
        // Update the state of the button right away
        votes++;
        $button.toggleClass('supported');
        $label.text(votes);
        
        
        $.ajax({
            url: $form.attr("action") + "?jsonpcallback=?" + $form.serialize(),
            dataType: "jsonp",
            type : 'post',
            processData: false,
            crossDomain: true,
            // contentType: "application/json",
            // jsonp: false,
            success: function(data) {
              done = true; 
              $("#popup").html(data.view)
            }
        });
        
        // $.ajax( {
        //   url : $form.attr("action"), 
        //   data : , 
        //   type : 'POST',
        //   dataType : "jsonp",
        //   beforeSend: function(xhr){
        //     xhr.withCredentials = true;
        //   },
        //   xhrFields: {
        //     withCredentials: true
        //   },
        //   crossDomain: true
        // }).complete(function(data) { 
        //   done = true; 
        //   $("#popup").html(data.view)
        // });
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
  
  // Throttle vote click, load result in popup
  // $("#popup #new_vote :submit").live("click",function(){alert("dfjhdkf")});
  // $("#new_vote").live("submit", function(){ alert("Goodbye!"); });                // jQuery 1.3+
  
  $("#new_vote").live("submit", throttledVoteCallback);
  $("#popup .close").live("click", closePopup);
});


