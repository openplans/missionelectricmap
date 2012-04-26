class AddEventFieldsToFeaturePoints < ActiveRecord::Migration
  def up
    change_table :feature_points do |t|
      t.has_attached_file :image
      t.datetime :event_time
      t.string :address, :event_link
    end
  end
  
  def self.down
    drop_attached_file :feature_points, :image
    remove_column :feature_points, :event_time
    remove_column :feature_points, :address
    remove_column :feature_points, :event_link
  end
end
