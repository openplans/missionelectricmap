class AddLocationTypeIdToFeaturePoints < ActiveRecord::Migration
  def change
    add_column :feature_points, :location_type_id, :integer
    FeaturePoint.find_each do |feature_point|
      feature_point.update_attribute :location_type_id, feature_point.feature_location_type.location_type_id if feature_point.feature_location_type.present?
    end
  end
end
