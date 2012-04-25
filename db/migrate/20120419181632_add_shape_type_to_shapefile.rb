class AddShapeTypeToShapefile < ActiveRecord::Migration
  def change
    add_column :shapefiles, :shape_type, :string
    
    Shapefile.find_each do |shapefile|
      execute(%Q{UPDATE "shapefiles" SET "shape_type" = 'Region' WHERE ("shapefiles"."id" = #{shapefile.id})})              
    end
  end
end
