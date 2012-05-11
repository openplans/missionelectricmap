class ActuallyAddCampaignIdToRelations < ActiveRecord::Migration
  def change
    add_column :feature_points, :campaign_id, :integer
    add_index :feature_points, :campaign_id
    add_column :activity_items, :campaign_id, :integer
    add_index :activity_items, :campaign_id
    add_column :location_types, :campaign_id, :integer
    add_index :location_types, :campaign_id
  end
end
