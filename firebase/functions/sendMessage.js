const axios = require("axios");

/**
 * Simple helper to ensure phone number has a + prefix (E.164-ish)
 */
function formatE164(phone) {
  if (!phone) return phone;
  const cleaned = phone.toString().trim();
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

/**
 * Send a text message via AOC Bot API
 * @param {string} fromPhone - Sender phone number with country code
 * @param {string} to - Recipient phone number with country code
 * @param {string} text - Message body text
 * @param {string} apiUrl - The specific POST URL for this company's bot
 * @param {string} apiKey - The authorization token or API key
 */
async function sendWhatsAppMessage(fromPhone, to, text, apiUrl, apiKey) {
  if (!apiUrl || !apiKey || !fromPhone) {
    console.error("❌ Bot API Credentials missing");
    throw new Error("Bot API URL, API Key, and From Phone are required for sending messages.");
  }

  const fromFormatted = formatE164(fromPhone);
  const toFormatted = formatE164(to);

  try {
    const response = await axios.post(
      apiUrl,
      {
        recipient_type: "individual",
        from: fromFormatted,
        to: toFormatted,
        type: "text",
        text: {
          body: text
        }
      },
      {
        headers: {
          "apikey": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ Message sent to ${to} via AOC API`);
    return response.data;
  } catch (err) {
    console.error(`❌ Failed to send message to ${to}:`, err.response?.data || err.message);
    throw err;
  }
}

async function sendTemplateMessage(fromPhone, to, templateName, apiUrl, apiKey, components = null, campaignName = "api-test") {
  if (!apiUrl || !apiKey || !fromPhone) {
    console.error("❌ Bot API Credentials missing");
    throw new Error("Bot API URL, API Key, and From Phone are required.");
  }
  
  const fromFormatted = formatE164(fromPhone);
  const toFormatted = formatE164(to);
  
  try {
    const payload = {
      from: fromFormatted,
      campaignName: campaignName,
      to: toFormatted,
      templateName: templateName,
      type: "template"
    };

    if (components) {
      payload.components = components;
    }

    const response = await axios.post(
      apiUrl,
      payload,
      {
        headers: {
          "apikey": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ Template "${templateName}" sent to ${to}`);
    return response.data;
  } catch (err) {
    console.error(`❌ Template send failed to ${to}:`, err.response?.data || err.message);
    throw err;
  }
}

async function sendInteractiveMessage(fromPhone, to, interactivePayload, apiUrl, apiKey) {
  if (!apiUrl || !apiKey || !fromPhone) {
    console.error("❌ Bot API Credentials missing");
    throw new Error("Bot API URL, API Key, and From Phone are required.");
  }
  
  const fromFormatted = formatE164(fromPhone);
  const toFormatted = formatE164(to);
  
  try {
    const payload = {
      recipient_type: "individual",
      from: fromFormatted,
      to: toFormatted,
      type: "interactive",
      interactive: interactivePayload
    };

    const response = await axios.post(
      apiUrl,
      payload,
      {
        headers: {
          "apikey": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ Interactive message sent to ${to}`);
    return response.data;
  } catch (err) {
    console.error(`❌ Interactive message send failed to ${to}:`, err.response?.data || err.message);
    throw err;
  }
}

/**
 * Send a media message (image, video, document) via AOC Bot API
 */
async function sendMediaMessage(fromPhone, to, mediaType, mediaPayload, apiUrl, apiKey) {
  if (!apiUrl || !apiKey || !fromPhone) {
    console.error("❌ Bot API Credentials missing");
    throw new Error("Bot API URL, API Key, and From Phone are required.");
  }
  
  const fromFormatted = formatE164(fromPhone);
  const toFormatted = formatE164(to);
  
  // mediaType should be "image", "video", or "document"
  try {
    const payload = {
      recipient_type: "individual",
      from: fromFormatted,
      to: toFormatted,
      type: mediaType,
      [mediaType]: mediaPayload // e.g. { link: "url", caption: "text" }
    };

    const response = await axios.post(
      apiUrl,
      payload,
      {
        headers: {
          "apikey": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ Media message (${mediaType}) sent to ${to}`);
    return response.data;
  } catch (err) {
    console.error(`❌ Media message send failed to ${to}:`, err.response?.data || err.message);
    throw err;
  }
}

module.exports = { 
  sendWhatsAppMessage, 
  sendTemplateMessage, 
  sendInteractiveMessage, 
  sendMediaMessage 
};
