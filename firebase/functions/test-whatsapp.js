const axios = require("axios");

const API_KEY = "GVA1Nhh7fz62iKcju4cs0GCz0bHurt";
// Replace this with your exact testing number
const TEST_PHONE_NUMBER = "919037258541";

// A list of the most common third-party API formats
const strategies = [
  {
    name: "Strategy 1: Meta Cloud API Proxy",
    url: "https://bot.greentickapi.com/v1/messages",
    method: "post",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    data: {
      messaging_product: "whatsapp",
      to: TEST_PHONE_NUMBER,
      type: "text",
      text: { body: "Test message from Strategy 1" }
    }
  },
  {
    name: "Strategy 2: Meta Cloud Graph API Proxy",
    url: "https://bot.greentickapi.com/v18.0/messages", // Assuming a generic phone ID isn't needed in URL for SaaS
    method: "post",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    data: {
      messaging_product: "whatsapp",
      to: TEST_PHONE_NUMBER,
      type: "text",
      text: { body: "Test message from Strategy 2" }
    }
  },
  {
    name: "Strategy 3: Waziper / ChatPion style",
    url: "https://bot.greentickapi.com/api/send",
    method: "post",
    headers: { "Content-Type": "application/json" },
    data: {
      number: TEST_PHONE_NUMBER,
      type: "text",
      message: "Test message from Strategy 3",
      access_token: API_KEY
    }
  },
  {
    name: "Strategy 4: Generic Gateway style A",
    url: "https://bot.greentickapi.com/api/messages/send",
    method: "post",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    data: {
      number: TEST_PHONE_NUMBER,
      message: "Test message from Strategy 4"
    }
  },
  {
    name: "Strategy 5: Generic Gateway style B",
    url: "https://bot.greentickapi.com/api/sendText",
    method: "post",
    headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
    data: {
      phone: TEST_PHONE_NUMBER,
      text: "Test message from Strategy 5"
    }
  }
];

async function runTests() {
  console.log("🕵️ Starting API Discovery on bot.greentickapi.com...\n");

  for (let s of strategies) {
    try {
      console.log(`Trying ${s.name} -> ${s.url}`);
      const res = await axios({
        url: s.url,
        method: s.method,
        headers: s.headers,
        data: s.data,
        timeout: 5000 // don't wait too long per test
      });

      console.log(`✅ SUCCESS on ${s.name}!`);
      console.log("Response:", res.data);
      console.log("\nSTOPPING TESTS. WE FOUND THE WINNER!");
      return;
    } catch (err) {
      if (err.response) {
        console.log(`❌ Failed with status ${err.response.status}`);
        // 404 means the URL is wrong. 
        // 401/403 means the URL exists, but auth failed (which is a clue!)
        // 400 means URL exists, auth passed, but format is wrong (huge clue!)
        if (err.response.status !== 404) {
          console.log(`   Detailed Error:`, JSON.stringify(err.response.data).substring(0, 100));
        }
      } else {
        console.log(`❌ Failed: Cannot connect (${err.code || err.message})`);
      }
    }
    console.log("-----------------------------------------");
  }

  console.log("\n😢 None of the common strategies worked.");
}

runTests();
