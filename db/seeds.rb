# Create rows for site options
for option_name in SiteOption::Names
  SiteOption.find_or_create_by_option_name option_name
end

["Mission Electric", "User-submitted"].each do |type|
  LocationType.find_or_create_by_name type
end

# Create initial admin user
Admin.create :email => "admin@example.com", :password => "p@ssw0rd", :password_confirmation => "p@ssw0rd", :level => 100
puts "Created an initial user. Be sure to change admin user password!"

