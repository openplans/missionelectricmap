class AddSubmitterEmailToComments < ActiveRecord::Migration
  def change
    add_column :comments, :submitter_email, :string
  end
end
