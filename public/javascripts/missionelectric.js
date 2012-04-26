// subdomain XSF workaround
document.domain = "openplans.org";

if (window.console) window.console.log("hello from shareabouts");

// marker click, show something in the popup

$(function(){
  $("#shareabouts iframe").ready(function(){
    console.log("iframe loaded")
    var intervalId = window.setInterval(function(){
      try {
        if (window.map.mapLoaded) {
          window.mapWidget = window.map.embeddedMap;
          console.log(window.mapWidget );      
          window.clearInterval(intervalId);
        };
      } catch(err) {
        window.clearInterval(intervalId);
      }
    },500);
});


