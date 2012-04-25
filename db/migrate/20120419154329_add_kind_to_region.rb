class AddKindToRegion < ActiveRecord::Migration
  def up
    add_column :regions, :kind, :string
    
    Region.find_each do |region|
      shapefile = region.shapefile
      if shapefile.respond_to? :kind
        execute(%Q{UPDATE "regions" SET "kind" = '#{shapefile.kind}' WHERE ("regions"."id" = #{region.id})})        
      end
    end
  end
  
  def down
    remove_column :regions, :kind
  end
end
