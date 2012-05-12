class Campaign < ActiveRecord::Base
  has_many :feature_points
  has_many :location_types
  has_many :activity_items
  
  validates :name, :presence => true
  validates :slug, :uniqueness => true
  
  before_save :generate_slug
  
  def generate_slug
    self.slug = ActiveSupport::Inflector.transliterate(name).downcase.gsub(/[^a-z0-9]/,'')
  end
  
  def expired?
    expiry_date.present? && expiry_date < Date.today
  end
end
