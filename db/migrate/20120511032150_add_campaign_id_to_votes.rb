class AddCampaignIdToVotes < ActiveRecord::Migration
  def change
    add_column :votes, :campaign_id, :integer
    add_index :votes, :campaign_id
  end
end
