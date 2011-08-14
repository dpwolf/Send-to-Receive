require 'bundler'
Bundler.require(:default, :environment)
require 'json'

enable :run
set :views, File.dirname(__FILE__) + "/views"
set :public, File.dirname(__FILE__) + "/public"


get '/' do
  erb :index
end

#text this
get '/sms' do
  builder do |xml|
    xml.instruct! :xml, :version => '1.0', :encoding => 'UTF-8'
    xml.Response do
      xml.Sms("Thanks! Check out the project at http://bit.ly/rjIqyO")
    end
  end
end

# endpoint
get '/data.json' do  
# twilio sid and auth token are stored in environment variables
# 
# to set these on a Mac, add lines to the bottom of your ~/.bashrc file like this:
# export TWILIO_SID=##########
# export TWILIO_AUTH_TOKEN=##########
# 
# for heroku run a command like this in your project directory:
# heroku config:add TWILIO_SID=########## TWILIO_AUTH_TOKEN=##########

  @account_sid = ENV['TWILIO_SID']
  @auth_token = ENV['TWILIO_AUTH_TOKEN']

  @client = Twilio::REST::Client.new(@account_sid, @auth_token)
  @account = @client.account
  @numbers = []
  @body = []
  @account.sms.messages.list.each_with_index do |sms,i|
    break if i > 9
    @numbers << sms.from.delete("+")
    @body << sms.body
  end
  content_type :json
  { :numbers => @numbers, :body => @body }.to_json
end
