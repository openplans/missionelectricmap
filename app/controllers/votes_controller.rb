class VotesController < ApplicationController
  
  before_filter :get_supportable
  before_filter :find_or_create_profile, :only => :create
    
  def create
    
    if access_allowed?      
      set_access_control_headers
      head :created
    else
      head :forbidden
    end
    
    @vote = @supportable.votes.create :profile => @profile
    
    store_vote_in_cookie @vote
    
    render :json => {
      :view => render_to_string(:partial => "#{supportable_class.tableize}/show.html", :locals => { supportable_class.underscore.to_sym => @supportable }) 
    }
  end
  
  def destroy
    if current_user
      @vote = current_user.votes.find params[:id]
    else
      @vote = Vote.where(:id => params[:id], :user_id => nil).first
      raise ActiveRecord::RecordNotFound unless supported?(@vote.supportable)
    end
        
    delete_vote_cookie @vote
    @vote.destroy

    respond_to do |format|
      format.json { 
        render :json => {
          :view => render_to_string(:partial => "#{supportable_class.tableize}/show.html", :locals => { supportable_class.underscore.to_sym => @supportable }) 
        }
      }
    end
  end
  
  private
  
  def set_access_control_headers 
    headers['Access-Control-Allow-Origin'] = request.env['HTTP_ORIGIN']
    headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
    headers['Access-Control-Max-Age'] = '1000'
    headers['Access-Control-Allow-Headers'] = '*,x-requested-with'
  end


  def access_allowed?
    Rails.logger.info "Attempted vote post from #{request.env['HTTP_ORIGIN']}"
    
    allowed_site_regexs = [/missionelectric\.org/, /openplans\.org/] 
    
    return allowed_site_regexs.any? { |regex| request.env['HTTP_ORIGIN'].match regex }
  end
  
  def get_supportable
    if params[:feature_point_id]
      @supportable = FeaturePoint.find params[:feature_point_id]
    end
  end
  
  def supportable_class
    @supportable.class.to_s
  end
  
  def delete_vote_cookie(vote)
    return if cookies[:supportable].inspect == "nil"
    
    supportable = vote.supportable
    supported   = Marshal.load cookies[:supportable]
    
    supportable_class = supportable.class.to_s.to_sym
        
    if supported[supportable_class].is_a?(Hash)
      supported[supportable_class].delete(supportable.id)
      
      cookies[:supportable] = { 
        :value => Marshal.dump(supported), 
        :expires => 4.years.from_now
      }
    end
  end
end