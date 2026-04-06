const { FieldValue } = require("firebase-admin/firestore");

/**
 * Add or update a lead in the `leads` collection with automated scoring.
 * @param {string} score - Optional intent-based score ('hot', 'warm', 'cold')
 */
async function upsertLead(db, phone, source = "whatsapp", companyId, score = null) {
  if (!companyId) throw new Error("companyId is required for SaaS lead management.");

  const leadsRef = db.collection("leads");
  
  // Look for existing lead FOR THIS SPECIFIC COMPANY
  const query = await leadsRef
    .where("phone", "==", phone)
    .where("companyId", "==", companyId)
    .limit(1)
    .get();

  const updateData = {
    lastSeen: FieldValue.serverTimestamp(),
    source
  };
  
  // Only update score if provided and the lead isn't already a 'customer'
  if (score) {
    updateData.leadScore = score;
  }

  if (!query.empty) {
    const doc = query.docs[0];
    const currentData = doc.data();
    
    // Auto-upgrade status to 'warm' if it's currently 'new' and they show interest
    if (currentData.status === "new" && (score === "hot" || score === "warm")) {
      updateData.status = "warm";
    }

    await doc.ref.update(updateData);
    return doc.id;
  }

  // Create new lead
  const newLead = {
    companyId,
    phone,
    createdAt: FieldValue.serverTimestamp(),
    lastSeen: FieldValue.serverTimestamp(),
    source,
    status: (score === "hot" || score === "warm") ? "warm" : "new",
    leadScore: score || "cold",
  };

  const newDoc = await leadsRef.add(newLead);
  return newDoc.id;
}

/**
 * Update the status of an existing lead (e.g. from 'new' to 'customer')
 */
async function updateLeadStatus(db, phone, companyId, newStatus) {
  if (!companyId || !phone) return;

  const leadsRef = db.collection("leads");
  const query = await leadsRef
    .where("phone", "==", phone)
    .where("companyId", "==", companyId)
    .limit(1)
    .get();

  if (!query.empty) {
    const doc = query.docs[0];
    await doc.ref.update({
      status: newStatus,
      lastSeen: FieldValue.serverTimestamp(),
    });
    console.log(`✅ Lead ${phone} status updated to: ${newStatus}`);
  }
}

module.exports = { upsertLead, updateLeadStatus };

