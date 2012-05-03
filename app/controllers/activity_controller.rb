class ActivityController < ApplicationController

  def index
    authorize_for_domains

    where = if params[:after].present?
      ["id > ?", params[:after]]
    else
      ""
    end
    
    @activity_items = ActivityItem.where(where)
      .limit(params[:limit])
      .order('created_at desc')
    
    render :json => {
      :vote_count => "#{ActivityItem.count} actions",
      :view       => render_to_string(:partial => "index.html")
    }.to_json
  end
end
