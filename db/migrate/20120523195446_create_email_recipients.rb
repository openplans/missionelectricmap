class CreateEmailRecipients < ActiveRecord::Migration
  def change
    create_table :email_recipients do |t|
      t.string :email, :name
      t.integer :feature_point_id, :campaign_id
      t.boolean :creator
      t.timestamps
    end
  end
end
