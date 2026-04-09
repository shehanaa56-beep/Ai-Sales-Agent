const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const Groq = require("groq-sdk");
const { upsertLead, updateLeadStatus } = require("./leadManager");

// We will instantiate Groq inside the function to ensure process.env is fully loaded by Firebase
let groqClient = null;

// Default system personality
const defaultPrompt = "You are a professional business assistant. Your goal is to help users with their inquiries, guide them to products/services, and manage appointment bookings efficiently.";

function getGroqClient(apiKey) {
  const key = apiKey || process.env.GROQ_API_KEY || "gsk_dummy_key_to_prevent_crash";
  // Always create a new client if the apiKey is different (or simplified: just create per request if needed)
  return new Groq({ apiKey: key });
}

async function fetchRelevantContext(db, queryText, companyId, config = {}) {
  if (!companyId) return "";

  const query = queryText.toLowerCase();
  
  // Detect price modifiers
  const isBudget = query.includes("cheap") || query.includes("budget") || query.includes("low price") || query.includes("affordable") || query.includes("low cost");
  const isPremium = query.includes("premium") || query.includes("expensive") || query.includes("best quality") || query.includes("high end");
  
  const queryWords = query.split(/\s+/).filter(word => word.length > 3);
  const contextDocs = [];
  
  console.log(`🔍 [RAG] Searching keywords: [${queryWords.join(", ")}] | Modifiers: Budget: ${isBudget}, Premium: ${isPremium}`);

  // 1. Search General Knowledge (nested subcollection)
  const knowledgeRef = db.collection("companies").doc(companyId).collection("knowledge");
  const knowledgeSnap = await knowledgeRef.get();
  
  console.log(`📚 [RAG] Total knowledge docs scanned: ${knowledgeSnap.size}`);

  knowledgeSnap.forEach((doc) => {
    const data = doc.data();
    const title = (data.title || "").toLowerCase();
    const content = (data.content || "").toLowerCase();
    const tags = data.tags || [];
    
    // Smart Match: Check for title/query overlap OR keyword hits in title/content/tags
    const isDirectMatch = query.includes(title) || title.includes(query);
    const hasKeywordHit = queryWords.some(word => 
      title.includes(word) || 
      content.includes(word) || 
      tags.some(t => t.toLowerCase().includes(word))
    );

    if (isDirectMatch || hasKeywordHit) {
      console.log(`✅ [RAG] Matched Knowledge: "${data.title}"`);
      contextDocs.push(`[KNOWLEDGE] ${data.title}: ${data.content}`);
    }
  });

  // 2. Search Product Catalog
  const productsRef = db.collection("products").where("companyId", "==", companyId);
  const productsSnap = await productsRef.get();

  productsSnap.forEach((doc) => {
    const data = doc.data();
    const name = (data.name || "").toLowerCase();
    const category = (data.category || "").toLowerCase();
    
    const isNameMatch = query.includes(name) || name.includes(query);
    const hasKeywordHit = queryWords.some(word => name.includes(word) || category.includes(word));

    if (isNameMatch || hasKeywordHit) {
      console.log(`✅ [RAG] Matched Product: "${data.name}"`);
      contextDocs.push({ 
        type: "PRODUCT", 
        data: `[PRODUCT] ${data.name} (${data.category}): Price ₹${data.price}. Stock: ${data.stock}. Status: ${data.status}. Description: ${data.description || 'No description available'}`,
        price: data.price 
      });
    }
  });

  // Smart Sorting for Recommendations
  let finalDocs = [];
  if (isBudget) {
    // Sort products by price ascending if user wants "cheap"
    const productDocs = contextDocs.filter(d => d.type === "PRODUCT").sort((a, b) => a.price - b.price);
    const knowledgeDocs = contextDocs.filter(d => d.type === "KNOWLEDGE");
    finalDocs = [...productDocs, ...knowledgeDocs];
  } else if (isPremium) {
    // Sort products by price descending if user wants "premium"
    const productDocs = contextDocs.filter(d => d.type === "PRODUCT").sort((a, b) => b.price - a.price);
    const knowledgeDocs = contextDocs.filter(d => d.type === "KNOWLEDGE");
    finalDocs = [...productDocs, ...knowledgeDocs];
  } else {
    finalDocs = contextDocs;
  }

  const topK = config.rag_topK || 5;
  const threshold = config.rag_threshold || 0.7;

  const finalContext = finalDocs.slice(0, topK).map(d => typeof d === 'string' ? d : d.data).join("\n\n---\n\n");
  console.log(`🎯 [RAG] Final Context length: ${finalContext.length} chars | Top-K: ${topK}`);
  return finalContext;
}

/**
 * Generate AI response with company-specific context and optional custom prompt.
 */
async function generateAIResponse(userMessage, context = "", systemPrompt = "", config = {}, history = [], existingOrder = null) {
  const finalSystemPrompt = `${systemPrompt || defaultPrompt} 
  
  DYNAMICS:
  - Be extremadamente CONCISE (max 2 sentences).
  - DO NOT summarize history. 
  - DO NOT say "I recall" or "As mentioned."
  - Answer the current question directly.
  
  APPOINTMENTS (CRITICAL):
  - If the user wants an appointment, you MUST collect: 1) Date (YYYY-MM-DD), 2) Time (HH:MM), 3) Service/Reason, and 4) Full Name.
  - Until you have ALL 4, keep asking politely for the missing ones.
  - Once you have all 4, generate the tag: [[BOOK_APPOINTMENT: Date, Time, Service, Doctor, Name]]
  - If no specific doctor is mentioned, use "None" for Doctor.
  
  COMMERCE:
  - For new purchases, use: [[CREATE_ORDER: Product, Price, Name, Occasion, Date]]`;

  // Format history messages
  const historyMessages = history.map(m => {
    const isUser = (m.direction === 'inbound' || !!m.inbound);
    const text = m.message || m.inbound || m.outbound;
    return { 
      role: isUser ? "user" : "assistant", 
      content: text 
    };
  }).filter(m => m.content);

  const userPrompt = `Product Catalog:
${context || "No products found."}

${existingOrder ? `Active Order: Product: ${existingOrder.product}, Status: ${existingOrder.status}, Amount: ₹${existingOrder.amount}.` : "No active orders found."}

Current User Message: "${userMessage}"

INSTRUCTIONS:
- IF USER SAYS PAYMENT IS DONE: Check "Active Order". If it exists, acknowledge it (e.g. "We are verifying it") and DO NOT generate a new [[CREATE_ORDER]] tag.
- IF NEW PURCHASE & ALL INFO READY: Include the [[CREATE_ORDER: ...]] tag.
- IF BOOKING & ALL INFO READY: Include the [[BOOK_APPOINTMENT: ...]] tag.
- ALWAYS BE CONCISE.
`;

  const groq = getGroqClient(config.groqKey || config.openaiKey);

  const completion = await groq.chat.completions.create({
    model: config.model || process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: finalSystemPrompt },
      ...historyMessages,
      { role: "user", content: userPrompt }
    ],
    max_tokens: parseInt(config.maxTokens) || 1024,
    temperature: parseFloat(config.temperature) || 0.5,
  });
  return completion.choices[0].message.content.trim();
}

/**
 * Extract and process [[CREATE_ORDER: ...]] command from AI reply
 */
async function processOrderCommand(db, reply, companyId, customerPhone) {
  // Regex to match [[CREATE_ORDER: Product, Price, Customer, Occasion, OccasionDate]]
  // Occasion and OccasionDate are optional.
  const orderRegex = /\[\[CREATE_ORDER:\s*(.*?),\s*(.*?),\s*([^,\]]+)(?:,\s*([^,\]]*),\s*([^,\]]*))?\]\]/i;
  const match = reply.match(orderRegex);

  if (match) {
    const [, productName, amount, customerName, occasion, occasionDate] = match;
    const cleanReply = reply.replace(orderRegex, "").trim();

    try {
      // 1. Create order record with occasion info
      const orderDoc = await db.collection("orders").add({
        companyId,
        customer_name: customerName,
        customer_phone: customerPhone,
        product: productName,
        amount: Number(amount.replace(/[^0-9]/g, "")),
        purchase_date: new Date().toISOString().split("T")[0],
        status: "Processing",
        source: "WhatsApp",
        occasion: occasion || null,
        occasion_date: occasionDate || null,
        created_at: FieldValue.serverTimestamp(),
      });

      // 2. Update lead status to customer
      await updateLeadStatus(db, customerPhone, companyId, "customer");

      const checkoutUrl = `http://localhost:5173/pay/${orderDoc.id}`;
      const paymentInstructions = `\n\n🔗 *Complete your payment here:* ${checkoutUrl}\n\nYour order is confirmed once payment is received! ✅`;

      console.log(`📦 Order created via AI: ${productName} for ${customerName}`);
      return cleanReply + paymentInstructions;
    } catch (err) {
      console.error("❌ Failed to process AI order command:", err);
      return cleanReply;
    }
  }

  return reply;
}

/**
 * Extract and process [[BOOK_APPOINTMENT: ...]] command from AI reply
 */
async function processAppointmentCommand(db, reply, companyId, customerPhone) {
  // Regex: [[BOOK_APPOINTMENT: Date, Time, Service, Doctor, CustomerName]]
  const appointmentRegex = /\[\[BOOK_APPOINTMENT:\s*(.*?),\s*(.*?),\s*(.*?),\s*(.*?),\s*([^,\]]+)\]\]/i;
  const match = reply.match(appointmentRegex);

  if (match) {
    const [, date, time, service, doctor, customerName] = match;
    const cleanReply = reply.replace(appointmentRegex, "").trim();

    try {
      const { createAppointment } = require("./appointmentController");
      await createAppointment(db, {
        companyId,
        customerPhone,
        customerName,
        date,
        time,
        service,
        doctor: doctor !== "None" ? doctor : null,
        status: "Pending",
        source: "WhatsApp"
      });

      console.log(`📅 Appointment booked via AI: ${service} for ${customerName} on ${date} at ${time}`);
      return cleanReply + `\n\n✅ *Appointment Request Received!*\n📅 Date: ${date}\n⏰ Time: ${time}\n👨‍⚕️ Doctor: ${doctor}\n\nWe will confirm your appointment shortly.`;
    } catch (err) {
      console.error("❌ Failed to process AI appointment command:", err);
      return cleanReply;
    }
  }

  return reply;
}

/**
 * Handle incoming webhook payload from Bot API (SaaS Ready)
 */
async function handleIncomingWhatsAppMessage(payload, db, sendFn) {
  // 1️⃣ Determine which company received the message
  // Note: Payload structure depends on the Bot API provider. 
  // We assume 'recipient' or 'to' contains the business phone number.
  let recipientNumber = "";
  let senderNumber = "";
  let messageText = "";

  // Logic to parse Bot API payload (Adjust based on exact provider)
  if (payload.messages && payload.messages[0]) {
    const msg = payload.messages[0];
    senderNumber = msg.from;
    // Improved extraction: check root 'to', message 'to', or metadata
    recipientNumber = payload.to || msg.to || payload.metadata?.display_phone_number; 
    messageText = msg.text?.body || msg.body || (typeof msg.text === 'string' ? msg.text : "");
  } else if (payload.entry) {
    // Fallback for Meta format
    const change = payload.entry[0].changes[0].value;
    if (change.messages && change.messages[0]) {
      senderNumber = change.messages[0].from;
      recipientNumber = change.metadata.display_phone_number;
      messageText = change.messages[0].text?.body || "";
    }
  }

  if (!recipientNumber || !messageText) {
    console.error("❌ Could not parse recipient or message text from payload:", JSON.stringify(payload, null, 2));
    return;
  }

  // 2️⃣ Look up the company configuration in Firestore
  // Normalize recipientNumber (strip + if present) for a more robust lookup
  const normalizedRecipient = recipientNumber.replace(/\+/g, "");

  const companySnap = await db.collection("companies")
    .where("whatsapp_number", "in", [recipientNumber, normalizedRecipient])
    .limit(1)
    .get();

  if (companySnap.empty) {
    console.error(`❌ No company found registered with number: ${recipientNumber} (normalized: ${normalizedRecipient})`);
    return;
  }

  const companyDoc = companySnap.docs[0];
  const companyData = companyDoc.data();
  const companyId = companyDoc.id;

  // 3️⃣ Retrieve AI & Settings Configuration
  const settingsRef = db.collection("companies").doc(companyId).collection("configs").doc("settings");
  const settingsSnap = await settingsRef.get();
  const settings = settingsSnap.exists ? settingsSnap.data() : {};

  const agentConfigRef = db.collection("companies").doc(companyId).collection("configs").doc("ai_agents");
  const agentConfigSnap = await agentConfigRef.get();
  const agentConfig = agentConfigSnap.exists ? agentConfigSnap.data() : {};
  
  const salesAgent = agentConfig.sales || { status: "Active", prompt: companyData.system_prompt || defaultPrompt };

  // 4️⃣ Check if Agent is Paused
  if (salesAgent.status === "Paused") {
    console.log(`⏸️ [AI] Sales Agent is PAUSED for company ${companyId}. Skipping response.`);
    // Optionally log the inbound message anyway
    await db.collection("conversations").add({
      companyId: companyId,
      phone: senderNumber,
      message: messageText,
      direction: "inbound",
      inbound: messageText,
      outbound: "[System: AI Agent Paused]",
      timestamp: FieldValue.serverTimestamp(),
    });
    
    await db.collection("conversations").add({
      companyId: companyId,
      phone: senderNumber,
      message: "[System: AI Agent Paused]",
      direction: "outbound",
      inbound: null,
      outbound: "[System: AI Agent Paused]",
      timestamp: FieldValue.serverTimestamp(),
    });
    return;
  }

  // 5️⃣ Retrieve Conversation History (Memory)
  const historySnap = await db.collection("conversations")
    .where("companyId", "==", companyId)
    .where("phone", "==", senderNumber)
    .orderBy("timestamp", "desc")
    .limit(10)
    .get();
  
  const history = historySnap.docs.map(doc => doc.data()).reverse();

  // 6️⃣ Retrieve Latest Order (Order Awareness)
  const orderSnap = await db.collection("orders")
    .where("customer_phone", "==", senderNumber)
    .where("companyId", "==", companyId)
    .orderBy("created_at", "desc")
    .limit(1)
    .get();
  
  const existingOrder = orderSnap.empty ? null : orderSnap.docs[0].data();

  // 7️⃣ Retrieve company-specific context (RAG)
  const context = await fetchRelevantContext(db, messageText, companyId, settings);

  // 8️⃣ Generate AI reply with history and order awareness
  let reply = await generateAIResponse(messageText, context, salesAgent.prompt, settings, history, existingOrder);

  console.log("🧠 [AI] Final Response:", reply);

  // 4.5️⃣ Intercept and process commands
  reply = await processOrderCommand(db, reply, companyId, senderNumber);
  reply = await processAppointmentCommand(db, reply, companyId, senderNumber);

  // 5️⃣ Send reply
  const senderId = companyData.whatsapp_number || companyData.phone_number_id;
  console.log(`📤 Sending AI reply to ${senderNumber} via ${senderId}...`);
  await sendFn(senderId, senderNumber, reply, companyData.api_url, companyData.api_key);

  // Log Inbound
  await db.collection("conversations").add({
    companyId: companyId,
    phone: senderNumber,
    message: messageText,
    direction: "inbound",
    inbound: messageText,
    outbound: null,
    timestamp: FieldValue.serverTimestamp(),
  });

  // Log Outbound
  await db.collection("conversations").add({
    companyId: companyId,
    phone: senderNumber,
    message: reply,
    direction: "outbound",
    inbound: null,
    outbound: reply,
    timestamp: FieldValue.serverTimestamp(),
  });

  // 7️⃣ Intelligent Lead Scoring
  let leadScore = "cold";
  const intentText = (messageText + " " + reply).toLowerCase();
  
  if (intentText.includes("buy") || intentText.includes("order") || intentText.includes("price") || intentText.includes("cost")) {
    leadScore = "warm";
  }
  if (intentText.includes("[[create_order") || intentText.includes("checkout") || intentText.includes("delivery address")) {
    leadScore = "hot";
  }

  await upsertLead(db, senderNumber, "whatsapp", companyId, leadScore);
}

/**
 * Simple webhook verification (if URL validation is required by the provider)
 */
function verifyWebhook(req, res) {
  const challenge = req.query["hub.challenge"] || req.query["challenge"];
  if (challenge) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(200);
}

module.exports = { verifyWebhook, handleIncomingWhatsAppMessage };
