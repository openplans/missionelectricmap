class CommentsController < ApplicationController
  before_filter :get_commentable, :find_or_create_profile
  
  def new
    authorize! :new, Comment
    
    @comment = Comment.new :profile => (current_profile || Profile.new), :commentable => @commentable
    
    render :json => {
      :view => render_to_string(:partial => "comments/new.html", :locals => { :message => I18n.t("feature.comment.after_vote") }) 
    }
  end
  
  def create
    authorize! :create, Comment
    authorize_for_domains
     
    @comment = @commentable.comments.new params[:comment].merge(:profile_id => @profile.id)    
    
    if @comment.valid?
      @comment.save if @comment.comment.present?
      # TODO sign up for mailing list
      @profile.update_attributes :name => @comment.submitter_name, :email => @comment.submitter_email unless @profile.new_record?
      
      render :json => {
        :view => render_to_string(:partial => "shared/share.html", :locals => { :shareable => @commentable }) 
      }
    else
      render :json => {
        :view => render_to_string(:partial => "comments/new.html", :locals => { :message => I18n.t("feature.comment.after_vote") }) 
      }
    end
  end
  
  private
  
  def get_commentable
    if params[:feature_point_id]
      @commentable = FeaturePoint.find params[:feature_point_id]
    end
  end
  
  def commentable_class
    @commentable.class.to_s
  end
end
