class WeekendValidator < ActiveModel::EachValidator  
  def validate_each(object, attribute, value)  
    if !value.saturday? && !value.sunday?
      object.errors[attribute] << (options[:message] || "should fall on a weekend")  
    end  
  end
end