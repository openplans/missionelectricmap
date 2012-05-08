class TimeOrderValidator < ActiveModel::Validator  
  def validate(record)
    if record.event_start_time >= record.event_end_time
      record.errors[:event_end_time] << "must be after the start time"
    end
  end
end