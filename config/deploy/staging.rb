set :deploy_to, "/var/www/missionelectricmap.dev.openplans.org"
set :domain, "173.236.65.124"
set :user, "passenger"
set :port, 7777

set :rails_env, "staging"

# set :default_environment, { 
#   'PATH' => "/usr/local/rvm/gems/ruby-1.9.2-p290/bin:$PATH",
#   'RUBY_VERSION' => 'ruby-1.9.2-p290',
#   'GEM_HOME' => '/usr/local/rvm/gems/ruby-1.9.2-p290',
#   'GEM_PATH' => '/usr/local/rvm/gems/ruby-1.9.2-p290:/usr/local/rvm/gems/ruby-1.9.2-p290@global' 
# }