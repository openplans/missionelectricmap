# LocationTypes classify types of locations on the map. They are created in
# the admin section and can optionally have an icon associated with them. 

class LocationType < ActiveRecord::Base
  scope :for_campaign, lambda { |campaign| where(:campaign_id => campaign.id) }
  scope :admin, where(:admin => true)
  scope :not_admin, where("admin <> true")
  scope :winner, where(:winner => true)
  scope :not_winner, where("winner <> true")
  
  has_one  :marker, :inverse_of => :location_type
  has_many :feature_points
  belongs_to :campaign
  
  has_attached_file :image, :styles => { :small => "32x32>", :icon => "16x16>" }
  
  validates :name, :presence => true
  validates :campaign, :presence => true
  
  accepts_nested_attributes_for :marker, :allow_destroy => true
  
  def admin_label
    "#{name} [#{campaign.name}] #{"(Admin) " if admin?}#{"(Winner)" if winner?}"
  end
end
