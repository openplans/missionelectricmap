class CommentsController < ApplicationController
  before_filter :get_commentable, :find_or_create_profile
  
  def new
    authorize! :new, Comment
    
    @comment = Comment.new :profile => (current_profile || Profile.new), :commentable => @commentable
    
    render :json => {
      :view => render_to_string(:partial => "comments/new.html", :locals => { :message => I18n.t("feature.comment.after_vote"), :from => :comment }) 
    }
  end
  
  def create
    authorize! :create, Comment
    authorize_for_domains
     
    @comment = @commentable.comments.new params[:comment].merge(:profile_id => @profile.id)    

    if @comment.valid?
      @comment.save
    else 
      if @comment.errors[:submitter_name].any? || @comment.errors[:submitter_email].any?
        return render :json => {
          :status => "error",
          :view => render_to_string(:partial => "comments/new.html", :locals => { :message => I18n.t("feature.comment.error"), :from => params[:from].to_sym, :vote_id => params[:vote_id] }) 
        }
      end      
    end
    
    # Updating point to be visible and complete if we're coming here from the new point form
    if params[:from].to_sym == :feature_point
      @commentable.update_attribute :visible, true
    end
    
    subscribe_commenter
    update_activity_item
    
    # now that we're here, the point has been finalized
    @commentable.update_attribute :visible, :true if !@commentable.visible?
    
    render :json => {
      :view => render_to_string(:partial => "shared/share.html", :locals => { :shareable => @commentable }) 
    }
  end
  
  private
  
  def subscribe_commenter
    subscribe_to_list(@comment.submitter_name, @comment.submitter_email)
  end
  
  def update_activity_item
    return true unless Vote.exists?(params[:vote_id])
    
    vote = Vote.find params[:vote_id]
    activity_item = vote.activity_items.where(:profile_id => @profile.try(:id)).first
    activity_item.update_attribute :user_name, @comment.submitter_name if activity_item
  end
  
  def get_commentable
    if params[:feature_point_id]
      @commentable = FeaturePoint.find params[:feature_point_id]
    end
  end
  
  def commentable_class
    @commentable.class.to_s
  end
end
