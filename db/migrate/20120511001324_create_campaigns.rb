class CreateCampaigns < ActiveRecord::Migration
  def change
    create_table :campaigns do |t|
      t.string :name
      t.date :expiry_date
      t.boolean :enable_events
      t.timestamps
    end
  end
end