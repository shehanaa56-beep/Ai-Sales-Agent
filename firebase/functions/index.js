const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const path = require("path");
const fs = require("fs");

// Common utility imports
const { sendWhatsAppMessage } = require("./sendMessage");

/**
 * Initialize Firebase Admin
 * We prioritize the service account key if present to allow connectivity to the real project
 * when the local Firestore emulator is unavailable (e.g. no Java 11).
 */
let dbInstance = null;
function getDb() {
  if (!dbInstance) {
    const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id,
        });
      }
    } else {
      if (admin.apps.length === 0) {
        admin.initializeApp();
      }
    }
    dbInstance = admin.firestore();
  }
  return dbInstance;
}

// Manual CORS handling to bypass emulator preflight blocks
const allowCors = (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  return false;
};

// Import function modules using lazy loading
let aiController;
let followupScheduler;

// 1. Order Created Trigger (V2)
exports.onOrderCreated = onDocumentCreated("orders/{orderId}", async (event) => {
  const db = getDb();
  const order = event.data.data();
  if (!order) return;
  
  const { companyId, customer_phone, product, purchase_date, usage_days } = order;
  if (!usage_days || !customer_phone || !companyId) return;

  // Fetch automation settings for the company
  const autoRef = db.collection("companies").doc(companyId).collection("configs").doc("automations");
  const autoSnap = await autoRef.get();
  const autoData = autoSnap.exists ? autoSnap.data() : {};

  // Handle REPEAT order reminder
  if (usage_days && autoData.repeat && autoData.repeat.on !== false) {
    const purchaseDate = new Date(purchase_date);
    purchaseDate.setDate(purchaseDate.getDate() + usage_days);
    const sendDate = purchaseDate.toISOString().split("T")[0];

    await db.collection("followups").add({
      companyId,
      customer_phone,
      type: "repeat",
      message: `Your ${product} may be running low! Time to reorder? 😊`,
      send_date: sendDate,
      status: "pending",
      product,
      created_at: FieldValue.serverTimestamp(),
    });
    console.log(`✅ Repeat follow-up created for ${customer_phone} on ${sendDate}`);
  }

  // Handle OCCASION (Birthday/Anniversary) reminder
  const { occasion, occasion_date } = order;
  if (occasion && occasion_date && autoData.birthday && autoData.birthday.on !== false) {
    const occDate = new Date(occasion_date);
    occDate.setFullYear(occDate.getFullYear() + 1);
    occDate.setDate(occDate.getDate() - 2);
    const reminderDate = occDate.toISOString().split("T")[0];

    await db.collection("followups").add({
      companyId,
      customer_phone,
      type: "birthday",
      message: `Hi ${order.customer_name || 'there'}! We remember you bought ${product} for a ${occasion} last year. Would you like to get a gift ready for this year too? 🎁`,
      send_date: reminderDate,
      status: "pending",
      product,
      created_at: FieldValue.serverTimestamp(),
    });
    console.log(`🎂 Yearly occasion follow-up created for ${customer_phone} on ${reminderDate}`);
  }
});

// 2. Daily Follow-up Scheduler (V2)
exports.dailyFollowupScheduler = onSchedule({
  schedule: "0 9 * * *",
  timeZone: "Asia/Kolkata"
}, async (event) => {
  const db = getDb();
  if (!followupScheduler) followupScheduler = require("./followupScheduler");
  await followupScheduler.runFollowupScheduler(db, sendWhatsAppMessage);
  await followupScheduler.runSmartRetarget(db, sendWhatsAppMessage);
});

// 3. WhatsApp Webhook (V2)
exports.whatsappWebhook = onRequest({ cors: true }, async (req, res) => {
  const db = getDb();
  if (!aiController) aiController = require("./aiController");
  
  if (req.method === "GET") return aiController.verifyWebhook(req, res);
  if (req.method === "POST") {
    try {
      await aiController.handleIncomingWhatsAppMessage(req.body, db, sendWhatsAppMessage);
      res.status(200).send('EVENT_RECEIVED');
    } catch (err) {
      console.error('Webhook handling error:', err);
      res.status(500).send('ERROR');
    }
  } else {
    res.status(405).send('Method Not Allowed');
  }
});

// 4. Get Customers (V2)
exports.getCustomers = onRequest({ cors: true }, async (req, res) => {
  const db = getDb();
  try {
    const snap = await db.collection("leads").get();
    const customers = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(customers);
  } catch (err) {
    console.error("getCustomers error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Broadcast Message (V2)
exports.broadcastMessage = onRequest({ cors: true }, async (req, res) => {
  const db = getDb();
  try {
    const { companyId, phones, message } = req.body;
    if (!companyId || !phones || !message) {
      return res.status(400).json({ error: "companyId, phones array, and message required" });
    }

    const companySnap = await db.collection("companies").doc(companyId).get();
    if (!companySnap.exists) {
      return res.status(404).json({ error: "Company not found" });
    }
    const { api_url, api_key, whatsapp_number } = companySnap.data();

    const results = [];
    for (const phone of phones) {
      try {
        await sendWhatsAppMessage(whatsapp_number, phone, message, api_url, api_key);
        
        await db.collection("conversations").add({
          companyId,
          phone,
          customer_name: "Customer", 
          message,
          direction: "outbound",
          inbound: null,
          outbound: message,
          timestamp: FieldValue.serverTimestamp(),
          agent: "Admin (Manual)"
        });

        results.push({ phone, status: "sent" });
      } catch (err) {
        results.push({ phone, status: "failed", error: err.message });
      }
    }
    res.json({ success: true, results });
  } catch (err) {
    console.error("broadcastMessage error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Get Appointments (V2)
exports.getAppointments = onRequest({ cors: true }, async (req, res) => {
  if (allowCors(req, res)) return;
  const db = getDb();
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId is required" });

    const appointmentController = require("./appointmentController");
    const appointments = await appointmentController.getAppointments(db, companyId);
    res.json(appointments);
  } catch (err) {
    console.error("getAppointments error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Update Appointment Status (V2)
exports.updateAppointmentStatus = onRequest({ cors: true }, async (req, res) => {
  if (allowCors(req, res)) return;
  const db = getDb();
  try {
    const { appointmentId, status } = req.body;
    if (!appointmentId || !status) return res.status(400).json({ error: "appointmentId and status are required" });

    const appointmentController = require("./appointmentController");
    const result = await appointmentController.updateAppointmentStatus(db, appointmentId, status);
    res.json(result);
  } catch (err) {
    console.error("updateAppointmentStatus error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 8. Create Manual Appointment (V2)
exports.saveAppointment = onRequest({ cors: true }, async (req, res) => {
  if (allowCors(req, res)) return;
  const db = getDb();
  try {
    const data = req.body;
    if (!data.companyId || !data.customerName || !data.date || !data.time) {
      return res.status(400).json({ error: "Missing required booking details (companyId, name, date, time)" });
    }

    const appointmentController = require("./appointmentController");
    const result = await appointmentController.createAppointment(db, {
      ...data,
      source: "Manual"
    });
    res.json(result);
  } catch (err) {
    console.error("saveAppointment error:", err);
    res.status(500).json({ error: err.message });
  }
});
