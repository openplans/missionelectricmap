class EmailRecipient < ActiveRecord::Base
  # email, name, feature_id, campaign_id, creator
  
  belongs_to :feature_point
  belongs_to :campaign
  
  validates :email, :presence => true
  validates :name, :presence => true
  
  def email_with_name
    "#{name} <#{email}>"
  end
end
