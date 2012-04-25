class AddNameToRegion < ActiveRecord::Migration
  def up
    add_column :regions, :name, :string
    
    Region.find_each do |region|
      shapefile = region.shapefile
      
      if shapefile.respond_to? :name_field
        execute(%Q{UPDATE "regions" SET "name" = '#{region.metadata[shapefile.name_field]}' WHERE ("regions"."id" = #{region.id})})        
      end
    end
  end
  
  def down
    remove_column :regions, :name
  end
end

