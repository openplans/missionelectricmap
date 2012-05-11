// subdomain XSF workaround
document.domain = "openplans.org";

jQuery(function($) {

  var popup = $("#popup");
  
  // Parses the iframe's src (map URL) for campaign and expiry flags, stores in urlParams
  var urlParams = {};
  (function () {
      var e,
          a = /\+/g,  // Regex for replacing addition symbol with a space
          r = /([^&=]+)=?([^&]*)/g,
          d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
          q = $("iframe[name=map]").attr("src").split("/?")[1];

      while (e = r.exec(q))
         urlParams[d(e[1])] = d(e[2]);
  })();

  // We always want to be sure our requests are going to the right campaign (& expiry)
  $.ajaxSetup({
    data : urlParams
  });
  
  // Monkeypatching String to add trim() for browsers that lack
  if(typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function() {
      return this.replace(/^\s+|\s+$/g, ''); 
    }
  }
  
  // URL for sharabouts map
  var iframeSrc = $("iframe[name=map]").attr("src").split("/?")[0];
  
  // Loads the passed content into the popup, 
  // optionally into a particular column
  // Applies fixes to form elements and whatnot.
  // Shows the popup.
  var popupContent = function(content, section) {
    var target = popup;
    if (section) target = popup.find(section);

    target.html(content);
    
    // Required labels
    target.find("label.required").append( $("<span>").addClass("required").html("*") );
    target.find("input:text, textarea").each(function(){
      if (this.value.trim().length > 0) popup.find("label[for=" + $(this).attr("id") + "]").hide();
    });
    
    // Deuglify selects
    if (target.find('select').customSelect) target.find('select').customSelect();
    
    popup.addClass("visible");
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
            latLngStr  = "latitude=" + latlng.lat + "&longitude=" + latlng.lng;

        // $.getJSON([iframeSrc, "/locations/within_region"].join(""), latLngStr, function(data){
        //   if (!data || data.status != "error") { // Location is good
           // submit new feature
        var $form = $(submitEvent.target);
    
        ajaxOptions = {
          url         : $form.attr("action"),
          data        : $form.serialize() + latLngStr, 
          type        : 'POST',
          dataType    : "json",
          crossDomain : true,
          complete : function(data) {   
            perform = true; 
            var responseJSON;
            var textarea = $("textarea[data-type]", data.responseText);
            if (textarea.length > 0)
              responseJSON= eval('(' + textarea.contents() + ')');
            else            
              responseJSON= eval('(' + data.responseText + ')');
            popupContent(responseJSON.view); // replacing entire popup contents here
            if (responseJSON.status != "error") {
              window.map.mapWrap("finalizeNewFeature");
            }
          }
        };
        
        if ($(":file", $form).val() != ""){
          var data = $(":text, textarea, select, :hidden", $form).serializeArray();        
          data.push({name: "latitude", value: latlng.lat})
          data.push({name: "longitude", value: latlng.lng})
        
          ajaxOptions.iframe=  true;
          ajaxOptions.processData =false;
          ajaxOptions.files =$(":file", $form);
          ajaxOptions.data = data;
        }
          
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
        var $form = $(submitEvent.target);
        $form.closest("#vote_link").hide();
                
        $.ajax( {
          url         : $form.attr("action"), 
          data        : $form.serialize()+ "&" + $.param(urlParams), 
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
          data        : $form.serialize()+ "&" + $.param(urlParams),
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
  
  // Opens a feature if one is permalinked via the window params
  var loadFeatureFromParams= function(){
    var hrefParts = window.location.href.split("#");
    if (hrefParts.length < 2) return;
    
    var locationParts = hrefParts[1].split("/");
    if (locationParts.length < 2) return;
    
    window.map.mapWrap("viewFeature", parseInt(locationParts[1], 10));
  };
  
  // Advances map to locatingNewFeature state, which, among other things, 
  // loads the new feature form into the popup
  var locateFeatureClick = function(event) {
    window.map.mapWrap("locateNewFeature", {
      url :  [iframeSrc, "/locations/new"].join(""),
      data : urlParams,
      success: function(data){
        popupContent(data.view)
      }
    });
    $(this).hide();
  };
  
  // Checks for winners array in map window. 
  // If not present, shows counting votes mode.
  var checkForCountingVotesMode = function(){
    // Only if #counting-votes mode is present do we check for winners
    $("#counting-votes").each(function(){
      if (!window.map.shareabouts.winners) $(this).css("display", "block");
    })
  };
  
  // Callback for when map has loaded
  // Fires place open if location is specified
  var afterMapLoad = function() {
    loadFeatureFromParams();
    $("#locate_feature", frames["map"].document).click(locateFeatureClick);
    checkForCountingVotesMode();
    // Move the WP content up
    $("#branding").animate({ marginBottom : "360px"} , 1500);
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
  
  // Hide / show labels depending on the content of form elements
  $("#popup input:text, #popup textarea").live("input propertychange", function(){
    var label = popup.find("label[for=" + $(this).attr("id") + "]");
    if (this.value.trim().length > 0) label.hide();
    else label.show();
  });
  
  // Bind listeners to popup forms and links
  $("#new_vote").live("submit", throttledVoteCallback);
  $("#new_feature_point").live("submit", throttledPointCallback);
  $("#new_comment").live("submit", throttledCallback);
  popup.find(".close").live("click", closePopup);
  popup.find("a[data-behavior=load_result_in_popup]").live("click", loadLinkInPopup);
  
  // Set up feeds from the map
  
  // Event Feed for events campaigns
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
  
  // Activity ticker
  $("#ticker").activityticker({
    url   : [iframeSrc, "/activity"].join(""),
    limit : 5, 
    click : function(e, ui) {
      e.preventDefault();
      window.map.mapWrap("viewFeature", ui.featureId);
      $('html, body').animate({scrollTop:150}, 'slow');
    }
  });

});


