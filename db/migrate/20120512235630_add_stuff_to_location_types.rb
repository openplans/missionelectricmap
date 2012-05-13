class AddStuffToLocationTypes < ActiveRecord::Migration
  def change
    add_column :location_types, :admin, :boolean
    add_column :location_types, :winner, :boolean
  end
end
