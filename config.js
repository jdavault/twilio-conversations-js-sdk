try {
  require('dotenv').config();
} catch (e) {
  console.error('error loading dotenv', e);
}

module.exports = {
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    apiKey: process.env.TWILIO_API_KEY,
    apiSecret: process.env.TWILIO_API_SECRET,
    chatServiceSid: process.env.TWILIO_CHAT_SERVICE_SID,
    reactAppTokenUrl: process.env.REACT_APP_ACCESS_TOKEN_SERVICE_URL
  },
  port: process.env.APP_PORT,
  nodePort: process.env.NODE_PORT,
  ngrokSubdomain: process.env.NGROK_SUBDOMAIN
}
