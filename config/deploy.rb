# RVM bootstrap

# Multi-user install. rvm_type :user doesn't work unless the production server
# is set up the same way, and it's not.
set :rvm_type, :system

#$:.unshift(File.expand_path('./lib', ENV['rvm_path']))
require 'rvm/capistrano'
set :rvm_ruby_string, '1.9.2-p320'

# bundler bootstrap
require 'bundler/capistrano'

# multistage deployment
set :stages, %w(nyc boston philadelphia nyc-staging boston-staging philadelphia-staging)
set :default_stage, "staging"
require 'capistrano/ext/multistage'

set :keep_releases, 2

require 'delayed/recipes'

# main details
set :application, "missionelectricmap"

set(:domain) { "#{domain}" }
role(:web) { domain }
role(:app) { domain }
role(:db, :primary => true) { domain }

# server details
default_run_options[:pty] = true
ssh_options[:forward_agent] = true
set :use_sudo, false

# repo details
set :scm, :git
set :repository, "git@github.com:openplans/missionelectricmap.git"
set :git_enable_submodules, 1
set :deploy_via, :remote_cache

set :branch do
  default_tag = `git tag`.split("\n").last

  tag = Capistrano::CLI.ui.ask "Tag to deploy (make sure to push the tag first): [#{default_tag}] "
  tag = default_tag if tag.empty?
  tag
end

# tasks
namespace :deploy do
  task :start, :roles => :app do
    run "touch #{current_path}/tmp/restart.txt"
  end

  task :stop, :roles => :app do
    # Do nothing.
  end

  desc "Restart Application"
  task :restart, :roles => :app do
    run "touch #{current_path}/tmp/restart.txt"
  end
  
  task :write_tag_file do
    put "#{branch}\n", File.join(release_path, 'TAG'), :roles => :app
  end
end

namespace :db do
  desc "Create Production Database"
  task :create do
    puts "\n\n=== Creating the #{default_stage} Database! ===\n\n"
    run "cd #{current_path}; rake db:create RAILS_ENV=#{default_stage}"
    system "cap deploy:set_permissions"
  end
end

namespace :delayed_job do 
  desc "Restart the delayed_job process"
  task :restart, :roles => :app do
    run "cd #{release_path}; #{rails_env} script/delayed_job restart"
  end
end

namespace :config do
  task :symlink, :except => { :no_release => true } do
    run "ln -nfs #{shared_path}/config/*.* #{release_path}/config/"
    run "if [ -d #{shared_path}/config/initializers ]; then ln -nfs #{shared_path}/config/initializers/*.rb #{release_path}/config/initializers/; fi"
  end
end

namespace :assets do
  task :precompile do
    run "cd #{release_path}; RAILS_ENV=#{rails_env} bundle exec rake assets:precompile"
  end
end

after "deploy:finalize_update", "config:symlink"
after 'deploy:update_code', "assets:precompile"
after "deploy:update_code", "deploy:write_tag_file"
after "deploy:update", "deploy:cleanup" 
after "deploy:restart", "delayed_job:restart"
