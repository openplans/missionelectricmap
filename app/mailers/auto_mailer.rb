class AutoMailer < ActionMailer::Base
  
  def thanks_email(message, mail_options={})
    #email, name, feature_id, campaign_id, creator
    
    @message = message
    mail mail_options
  end
end
