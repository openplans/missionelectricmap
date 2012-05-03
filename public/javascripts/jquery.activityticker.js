if(typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, ''); 
  }
}

$.widget("ui.activityticker", (function() {
  return {
    options : {
      url          : "",    // should return HTML of lis, like "<li>thing</li><li>thing2</li>"
      frequency    : 30000, // ms between checking for new items
      limit        : 30,    // max number of items to add each refresh
      loaderClass  : 'loading' // class name for li that holds the spinner, for infinite tickers
    },

    /**
     * Constructor
     */
    _create : function() {
      var self = this;
      
      var daysToGo = this.element.find("p.days-to-go").remove().html();
      
      this.vote_count = $("<li>").addClass("actions");
      this.header = $("<div>").addClass("head")
        .append( $("<h3>").text("Recent Votes") )
        .append( $("<ul>")
          .append( this.vote_count )
          .append( $("<li>").addClass("days-to-go").html(daysToGo) ) )
        .appendTo(this.element).hide();
      
      this.list = $( "<ul>" ).addClass("activity_items").appendTo( this.element );
      this.refresh();
      this._trigger("toggle"); // Display the ticker

      // Bind click event for the ticker links
      this.list.on('click', 'li > a', function(e) {
        self._trigger('click', e, {
          featureId: parseInt($(this).parent('li').attr('data-feature-id'), 10)
        });
      });
    },

    /**
     * Periodic refresh at top
     */
    refresh : function(activity_id) {
      var self = this;

      $.getJSON( this.options.url, function(data) {
        self.list.prepend(data.responseText);
        self.vote_count.html(data.vote_count);
        self.header.show();
        
        var after_id = self.list.find("li:first").data("id");

        self.timeout = window.setTimeout(function(){
          self.refresh(after_id);
        }, self.options.frequency);
      });
    }
  };
})());