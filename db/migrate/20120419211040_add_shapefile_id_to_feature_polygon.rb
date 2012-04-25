class AddShapefileIdToFeaturePolygon < ActiveRecord::Migration
  def change
    add_column :feature_polygons, :shapefile_id, :integer
    add_index :feature_polygons, :shapefile_id
  end
end
