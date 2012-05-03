class MailChimpJob < Struct.new(:opts)

  def run_hominid(attempts = 0, &block)
    attempts += 1
    block.call

  rescue EOFError => e
    if attempts < 3
      Rails.logger.error("Hominid EOFError, retrying: #{e.message}")
      run_hominid(attempts, &block)
    else
      Rails.logger.error("Give up on EOFError due to more than 3 attempts failed. Opts: #{opts.inspect}")
    end
  end

  def get_h
    @h ||= Hominid::API.new I18n.t("config.mailchimp.api_key"), {:timeout => 60}
  end

  def perform
    return unless opts[:action]

    case opts[:action]
    when :subscribe
      run_hominid do
        list_id = get_h.find_list_id_by_name I18n.t("config.mailchimp.list_name")
        vars = { 'FNAME' => opts[:name] }
        
        get_h.list_subscribe list_id, opts[:email], vars, 'html', true, true, true, false
      end
    end

  rescue Hominid::APIError => e
    Rails.logger.error "Hominid API error: #{e.message}"
  end
end