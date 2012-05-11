class Campaign < ActiveRecord::Base
  has_many :feature_points
  has_many :location_types
  has_many :activity_items
  
  validates :name, :presence => true
end
