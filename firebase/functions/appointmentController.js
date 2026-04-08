const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

/**
 * Fetch all appointments for a specific company
 */
const getAppointments = async (db, companyId) => {
  try {
    // We removed .orderBy("created_at", "desc") to avoid requiring a composite index
    // This makes the system "just work" for the user immediately.
    const appointmentsSnap = await db.collection("appointments")
      .where("companyId", "==", companyId)
      .get();
    
    const appointments = appointmentsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.() || doc.data().created_at
    }));

    // Sort in memory instead
    return appointments.sort((a, b) => {
      const dateA = a.created_at?.seconds || 0;
      const dateB = b.created_at?.seconds || 0;
      return dateB - dateA; // Descending
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    throw new Error("Failed to fetch appointments");
  }
};

/**
 * Update the status of an appointment
 */
const updateAppointmentStatus = async (db, appointmentId, status) => {
  try {
    await db.collection("appointments").doc(appointmentId).update({
      status,
      updated_at: FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating appointment:", error);
    throw new Error("Failed to update appointment status");
  }
};

/**
 * Create a new appointment (logic used by AI or manual entry)
 */
const createAppointment = async (db, appointmentData) => {
  try {
    const docRef = await db.collection("appointments").add({
      ...appointmentData,
      status: appointmentData.status || "Pending",
      created_at: FieldValue.serverTimestamp()
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw new Error("Failed to create appointment");
  }
};

module.exports = {
  getAppointments,
  updateAppointmentStatus,
  createAppointment
};
