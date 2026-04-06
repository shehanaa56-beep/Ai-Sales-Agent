const admin = require("firebase-admin");

// Initialize Firebase App
// Make sure you have your FIREBASE_PROJECT_ID environment variable set 
// or run this via `firebase functions:shell`
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const sampleKnowledgeData = [
  {
    title: "Pricing Packages",
    tags: ["price", "cost", "package", "plan", "how much", "fees"],
    content: "We offer three main packages for our software: \n1. Basic Plan: $29/month (includes core CRM features for 1 user).\n2. Pro Plan: $79/month (includes basic + automations & up to 5 users).\n3. Enterprise: Custom pricing (unlimited users + dedicated support). \nPlease let me know if you want a detailed feature breakdown for any of these!"
  },
  {
    title: "Support Hours & Contact",
    tags: ["support", "help", "contact", "hours", "talk to human", "agent"],
    content: "Our dedicated support team is available Monday through Friday, from 9 AM to 6 PM EST. \nIf you are facing an urgent technical issue, you can reach out via email at support@ourcompany.com. If you want to connect with a human agent right now, I can transfer your chat to an available representative!"
  },
  {
    title: "Product Overview",
    tags: ["what is this", "product", "features", "do you offer", "overview"],
    content: "Our main product is an AI-powered CRM designed to boost team sales and manage follow-ups automatically! With our system, you can integrate your WhatsApp Business account and let AI handle initial customer inquiries, manage leads, and auto-schedule reminders."
  }
];

async function seedKnowledge() {
  console.log("Seeding Database with sample Knowledge items...");
  try {
    const knowledgeRef = db.collection("knowledge");
    
    for (const item of sampleKnowledgeData) {
      // Check if item already exists
      const existing = await knowledgeRef.where("title", "==", item.title).get();
      if (existing.empty) {
        await knowledgeRef.add({
          title: item.title,
          tags: item.tags,
          content: item.content,
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Added: ${item.title}`);
      } else {
        console.log(`ℹ️ Skipped (already exists): ${item.title}`);
      }
    }
    console.log("Done seeding!");
  } catch (err) {
    console.error("Error seeding Knowledge Data:", err);
  }
}

seedKnowledge();
