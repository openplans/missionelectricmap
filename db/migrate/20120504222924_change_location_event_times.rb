class ChangeLocationEventTimes < ActiveRecord::Migration
  def up
    remove_column :feature_points, :event_time
    add_column :feature_points, :event_start_time, :time
    add_column :feature_points, :event_end_time, :time
    add_column :feature_points, :event_date, :date
  end

  def down
    remove_column :feature_points, :event_start_time
    remove_column :feature_points, :event_end_time
    remove_column :feature_points, :event_date
    add_column :feature_points, :event_time
  end
end
