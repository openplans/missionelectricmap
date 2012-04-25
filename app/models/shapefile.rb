# Shapefile represents a collection of Regions. Admins can upload a Shapefile
# (or, a zip file that contains, at the least, a .shx, .shp, and .dbf file) 
# and then the shapefile is parsed for Regions. Shapefile parsing and region 
# creation happens in lib/jobs/shapefile_job.rb. Shapefiles that contain a .prj
# file are reprojected via ogr2ogr.
class Shapefile < ActiveRecord::Base
  
  ShapeTypes = %w{FeaturePolygon Region}
  
  has_many :regions, :inverse_of => :shapefile, :dependent => :destroy
    
  has_attached_file :data # zip file
  
  validates :kind, :presence => true, :uniqueness => true
  validates :name_field, :presence => true  # which field of the shapefile contains feature names.
  validates :shape_type, :presence => true, :inclusion => { :in => ShapeTypes }
  
  validates_attachment_presence :data
  validates_attachment_content_type :data, :content_type => "application/zip", :if => :attachment_present?
  validates_with ShapefileContentValidator, :if => :attachment_present?
  
  before_save  :set_default_update_flag
  after_create :enqueue_importer
  after_save   :update_other_region_defaults
    
  include Workflow
  workflow do
    state :unprocessed do
      event :import, :transitions_to => :importing
    end
    state :importing do
      event :complete, :transitions_to => :complete
      event :error, :transitions_to => :import_error
    end
    state :complete
    state :import_error
  end
  
  def error(message)
    update_attribute :job_error, message
  end
  
  # rails_adminism
  def shape_type_enum
    ShapeTypes
  end
  
  def shapes
    shape_type.constantize.where :shapefile_id => id
  end
  
  def attachment
    data
  end
  
  private
  
  def attachment_present?
    data.present?
  end
  
  def enqueue_importer
    Delayed::Job.enqueue ShapefileJob.new(data.path, id)
  end
    
  def set_default_update_flag
    @update_other_regions_default = true if changes[:default] && changes[:default].last
  end
  
  def update_other_region_defaults
    Shapefile.update_all( "\"default\" = false", "id <> #{id} AND \"default\" = true" ) if @update_other_regions_default
  end
end
