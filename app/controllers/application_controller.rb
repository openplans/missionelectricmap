class ApplicationController < ActionController::Base
  include ValidBrowser
  
  protect_from_forgery
  # before_filter :restrict_browser
  before_filter :set_campaign
  before_filter :set_locale
  before_filter :set_admin_current_admin
  
  def set_campaign
    @campaign = Campaign.find_by_slug( ActiveSupport::Inflector.transliterate( params[:c] ).downcase.gsub(/[^a-z0-9]/,'') )
  end
  
  def set_locale
    I18n.locale = env['rack.locale'] || I18n.default_locale
  end
  
  def authenticate_user!
    if !current_user
      # This should work, but session is lost. See https://github.com/plataformatec/devise/issues/1357
      # session[:return_to] = request.fullpath
      redirect_to user_omniauth_authorize_path(:google_apps, :origin => request.fullpath)
    end
  end   

  def after_sign_in_path_for(resource)
    # This should work, but session is lost. See https://github.com/plataformatec/devise/issues/1357
    # return_to = session[:return_to]
    # session[:return_to] = nil
    return_to = request.env['omniauth.origin']
    stored_location_for(resource) || return_to || root_path  
  end
  
  def find_or_create_profile
    @profile = current_profile || set_profile_cookie(Profile.create_by_request_fingerprint(request))
  end
  
  def authorize_for_domains
    if access_allowed?      
      set_access_control_headers
      head :created
    else
      head :forbidden
    end
  end
  
  def subscribe_to_list(name, email)
    Delayed::Job.enqueue MailChimpJob.new( :action => :subscribe, :name => name, :email => email)
  end
  
  def set_access_control_headers 
    headers['Access-Control-Allow-Origin'] = request.env['HTTP_ORIGIN']
    headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
    headers['Access-Control-Max-Age'] = '1000'
    headers['Access-Control-Allow-Headers'] = '*,x-requested-with'
  end


  def access_allowed?
    Rails.logger.info "Attempted access from #{request.env['HTTP_ORIGIN']}"
    
    allowed_site_regexs = [/missionelectric\.org/, /openplans\.org/] 
    
    return allowed_site_regexs.any? { |regex| request.env['HTTP_ORIGIN'].match regex }
  end
  
  JSON_ESCAPE_MAP = {
      '\\'    => '\\\\',
      '</'    => '<\/',
      "\r\n"  => '\n',
      "\n"    => '\n',
      "\r"    => '\n',
      '"'     => '\\"' }

  def escape_json(json)
    json.gsub(/(\\|<\/|\r\n|[\n\r"])/) { JSON_ESCAPE_MAP[$1] }
  end

  def current_profile
    @current_profile ||= if current_user.present?
      current_user.profile
    elsif cookies[:profile].inspect != "nil" # requires that we have set the profile cookie
      require 'profile'
      Marshal.load(cookies[:profile])
    else
      set_profile_cookie Profile.find_by_request_fingerprint(request)
    end
  end
  
  def current_ability
    @current_ability ||= Ability.new(current_admin, @campaign, params[:e] == "1") 
  end
  
  def set_cache_buster
    response.headers["Cache-Control"] = "no-cache, no-store, max-age=0, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "Fri, 01 Jan 1990 00:00:00 GMT"
  end
  
  def set_admin_current_admin
    Admin.current_admin = current_admin
  end
  
  def supported?(supportable)
    return false if cookies[:supportable].inspect == "nil"
    
    supported   = Marshal.load(cookies[:supportable])
    key         = supportable.class.to_s.to_sym
    
    supported.key?(key) && supported[key][supportable.id]
  end
  
  def restrict_browser
    unless valid_browser?
      render :template => 'home/no_ie6.html.erb', :layout => false
      return false
    end
  end
  
  private
  
  def store_vote_in_cookie(vote)
    supportable = vote.supportable
    supported   = cookies[:supportable].inspect != "nil" ? Marshal.load(cookies[:supportable]) : {}
    
    supportable_class = supportable.class.to_s.to_sym
        
    if supported[supportable_class].is_a?(Hash)
      supported[supportable_class][supportable.id] = vote.id
    else
      supported[supportable_class] = { supportable.id => vote.id }
    end
    
    cookies[:supportable] = { 
      :value => Marshal.dump(supported), 
      :expires => 4.years.from_now
    }
  end
  
  # Sets the profile in a cookie and returns the profile
  def set_profile_cookie(profile)
    cookies[:profile] = { 
      :value => Marshal.dump(profile), 
      :expires => 4.years.from_now
    }
    
    profile
  end
end
