class FeaturePointsController < ApplicationController

  before_filter :ignore_feature_location_type_fields_if_empty, :find_or_create_profile, :only => :create  
  before_filter :set_cache_buster, :only => :show # for IE8
  
  def share    
    @feature_point = FeaturePoint.find params[:id]
    
    render :json => {
      :view => render_to_string(:partial => "shared/share.html", :locals => {
        :shareable => @feature_point,
        :message => I18n.t("feature.sharing.after_vote") # we can only get here directly after voting
      })
    }
  end
  
  def index
    respond_to do |format|
      format.html do 
        @winners = FeaturePoint.for_campaign(@campaign).joins(:location_type).where("location_types.name ILIKE '%winner%'") if @campaign
      end
      format.json do
        @feature_points = FeaturePoint.for_campaign(@campaign).visible.where [ "id > ?", params[:after].to_i ]
        render :json => @feature_points.map(&:as_json)
      end
    end
  end
  
  def events
    # authorize_for_domains
    
    return render :status => :ok unless @campaign.enable_events?
    
    @feature_points = FeaturePoint.for_campaign(@campaign).visible
    
    render :json => {
      :view => render_to_string(:partial => "events.html")
    }
  end
  
  def new
    @feature_point = FeaturePoint.new

    respond_to do |format|
      format.json { render :json => { :view => render_to_string(:partial => "form.html") } }
    end
  end
  
  def create
    authorize! :create, FeaturePoint
    # authorize_for_domains

    @feature_point = FeaturePoint.new params[:feature_point].merge({:the_geom => the_geom_from_params(params), :profile => @profile, :campaign => @campaign})
    
    @feature_point.location_type = LocationType.for_campaign(@campaign).where(:name => (current_admin.present? ? "Mission Electric" : "User-submitted")).first
        
    if @feature_point.save
      find_and_store_vote @feature_point
      @comment = @feature_point.comments.new :profile => @profile
      response = render_to_string( :partial => "confirm.html", :locals => { 
        :message => I18n.t("feature.comment.after_point_added"), :vote_id => @feature_point.votes.first.id 
      } )
      render upload_response(response, :ok)
    else
      response = render_to_string( :partial => "form.html.erb" )
      render upload_response(response, :error)
    end
  end
  
  def edit
    
  end
  
  def update
    @feature_point = FeaturePoint.for_campaign(@campaign).find params[:id]
    authorize! :update, @feature_point
    
    @feature_point.update_attributes params[:feature_point]

    respond_to do |format|
      format.json do
        render :json => { :status => "error", :view => render_to_string(:partial => "show.html.erb", :locals => { :feature_point => @feature_point }) } 
      end
    end
  end
  
  def show
    # past campaigns?
    @feature_point = FeaturePoint.visible.find params[:id], :include => :comments
    respond_to do |format|
      format.html do
        render :action => 'index'
      end
      format.json do
        render :json => { :view => render_to_string(:partial => "show.html", :locals => { :feature_point => @feature_point }) } 
      end
    end
  end
  
  def within_region
    @feature_point = FeaturePoint.new :the_geom => the_geom_from_params(params)
        
    if !@feature_point.valid? && @feature_point.errors[:the_geom].present?
      respond_to do |format|
        format.json { render :json => { :status => "error", :message => @feature_point.errors[:the_geom].join(". ") } }
      end
    else
      respond_to do |format|
        format.json { render :json => { :status => "ok" } }
      end
    end
  end
  
  private
  
  def find_and_store_vote(feature_point)
    vote = @profile.votes.where(:supportable_id => feature_point.id, :supportable_type => feature_point.class.to_s).first
    store_vote_in_cookie vote
  end
  
  def the_geom_from_params(p)
    Point.from_x_y p[:longitude].to_f, p[:latitude].to_f, 4326
  end
  
  def ignore_feature_location_type_fields_if_empty
    params[:feature_point].delete(:feature_location_type_attributes) if params[:feature_point] && params[:feature_point][:feature_location_type_attributes] && 
      params[:feature_point][:feature_location_type_attributes][:location_type_id].blank?
  end
  
  # def upload_response(view)
  #   <<-HTML
  #   <textarea data-type="application/json">
  #      {view:"#{escape_json(view)}"}
  #   </textarea>
  #   HTML
  def upload_response(view, status=:ok)
    if request.headers["CONTENT_TYPE"].match /multipart/
      {
        :text => "<textarea data-type='application/json'>{view:#{view.to_json}, status:'#{status}'}</textarea>"
      }
    else
      {
        :json => {:view => view, :status => status }
      }
    end
  end  
end
