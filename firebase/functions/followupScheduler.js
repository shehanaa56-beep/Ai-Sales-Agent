/**
 * Daily Follow-up Scheduler
 * Runs daily at 9 AM IST via Cloud Scheduler
 * Checks for pending follow-ups with send_date <= today
 * Sends messages and updates status to "sent"
 */

async function runFollowupScheduler(db, sendWhatsAppMessage) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  console.log(`🔁 Running follow-up scheduler for ${today}`);

  try {
    // Fetch all pending follow-ups where send_date <= today
    const snap = await db
      .collection("followups")
      .where("status", "==", "pending")
      .where("send_date", "<=", today)
      .get();

    if (snap.empty) {
      console.log("📭 No pending follow-ups for today");
      return;
    }

    // 1. Group follow-ups by companyId to optimize database reads
    const companyGroups = {};
    snap.forEach(doc => {
      const data = doc.data();
      const cId = data.companyId || "default"; // Handle legacy data
      if (!companyGroups[cId]) companyGroups[cId] = [];
      companyGroups[cId].push({ id: doc.id, ref: doc.ref, ...data });
    });

    for (const [companyId, followups] of Object.entries(companyGroups)) {
      console.log(`🏢 [Company: ${companyId}] Processing ${followups.length} follow-ups`);

      // 2. Fetch Company Credentials and automation settings
      const companySnap = await db.collection("companies").doc(companyId).get();
      if (!companySnap.exists) {
        console.log(`⚠️ Company ${companyId} not found, skipping.`);
        continue;
      }
      const { api_url, api_key, whatsapp_number } = companySnap.data();

      const autoRef = db.collection("companies").doc(companyId).collection("configs").doc("automations");
      const autoSnap = await autoRef.get();
      const autoConfig = autoSnap.exists ? autoSnap.data() : {};

      const batch = db.batch();
      let sentCount = 0;
      let automationRunUpdates = {};

      for (const followup of followups) {
        const { id, customer_phone, message, type, product, ref } = followup;

        // 3. Check if this automation type is ACTIVE
        if (autoConfig[type] && autoConfig[type].on === false) {
           console.log(`⏸️ [Automation: ${type}] is PAUSED for ${companyId}, skipping ${customer_phone}`);
           continue; 
        }

        try {
          // 4. Send the message with company-specific credentials
          await sendWhatsAppMessage(whatsapp_number, customer_phone, message, api_url, api_key);

          // 5. Update status and save conversation
          batch.update(ref, {
            status: "sent",
            sent_at: new Date().toISOString(),
          });

          await db.collection("conversations").add({
            companyId,
            phone: customer_phone,
            inbound: null,
            outbound: message,
            timestamp: new Date().toISOString(),
            agent: `Automation: ${type}`
          });

          sentCount++;
          automationRunUpdates[type] = (automationRunUpdates[type] || 0) + 1;
          console.log(`✅ Sent to ${customer_phone} (${type}: ${product})`);
        } catch (err) {
          console.error(`❌ Failed to send to ${customer_phone}:`, err.message);
          batch.update(ref, { status: "failed", error: err.message });
        }
      }

      // 6. Finalize: Update 'runs' count in Firestore
      if (sentCount > 0) {
        const finalAutoData = { ...autoConfig };
        Object.keys(automationRunUpdates).forEach(type => {
            if (finalAutoData[type]) {
                finalAutoData[type].runs = (parseInt(finalAutoData[type].runs) || 0) + automationRunUpdates[type];
            }
        });
        batch.set(autoRef, finalAutoData, { merge: true });
        await batch.commit();
        console.log(`📊 [Company: ${companyId}] sent ${sentCount} messages.`);
      }
    }
  } catch (err) {
    console.error("Scheduler error:", err);
    throw err;
  }
}

/**
 * Smart Retargeting – after a follow‑up is sent, if the customer hasn't replied within 24 hours we send a gentle reminder.
 */
async function runSmartRetarget(db, sendFn) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const snap = await db.collection('followups')
    .where('status', '==', 'sent')
    .where('sent_at', '<=', `${cutoff}T23:59:59`)
    .get();
  if (snap.empty) {
    console.log('📭 No follow‑ups need retargeting today');
    return;
  }
  console.log(`🔔 Retargeting ${snap.size} follow‑up(s)`);
  const batch = db.batch();
  for (const doc of snap.docs) {
    const data = doc.data();
    const { companyId, customer_phone, product } = data;
    
    // Fetch credentials for retargeting
    const companySnap = await db.collection("companies").doc(companyId || "default").get();
    if (!companySnap.exists) continue;
    const { api_url, api_key, whatsapp_number } = companySnap.data();

    const reminder = `Hi again! Just checking if you received our previous message about ${product}. Let us know if you need anything.`;
    try {
      await sendFn(whatsapp_number, customer_phone, reminder, api_url, api_key);
      batch.update(doc.ref, { status: 'reminded', reminded_at: new Date().toISOString() });
    } catch (e) {
      console.error('Retarget send failed for', customer_phone, e.message);
    }
  }
  await batch.commit();
}

module.exports = { runFollowupScheduler, runSmartRetarget };
