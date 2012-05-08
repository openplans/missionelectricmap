# Votes are a simple way for visitors to show support for a map feature. 
# Votes are polymorphic, so they can be applied to any model as long as the 
# other model specifies `has_many :votes, :as => :supportable`

class Vote < ActiveRecord::Base
  
  scope :visible, joins(", feature_points")
    .where("votes.supportable_type = 'FeaturePoint'")
    .where("votes.supportable_id = feature_points.id")
    .where("feature_points.visible = true")
  
  after_create :create_activity_item
  
  belongs_to :supportable, :polymorphic => true
  belongs_to :profile
  has_one    :user, :through => :profile
  has_many   :activity_items, :as => :subject, :inverse_of => :subject, :dependent => :destroy
  
  validates :supportable, :presence => true
  
  def create_activity_item
    activity_items.create :subject_parent => supportable, :profile => profile, :user_name => I18n.t("activity.anonymous_voter")
  end
  
end
