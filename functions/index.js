const {onRequest} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

exports.helloWorld = onRequest((req, res) => {
  logger.info("Hello from XED21!", {structuredData: true});
  res.send("Hello from Firebase Functions!");
});

exports.onUserCreated = onDocumentCreated("users/{userId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log("No data associated with the event");
    return;
  }
  const data = snapshot.data();

  // Check if the document was just created
  if (event.params.userId && !data.createdAt) {
    try {
      await db.collection("users").doc(event.params.userId).update({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.log(`Set timestamps for user: ${event.params.userId}`);
    } catch (error) {
      logger.error(
          `Error setting timestamps for user: ${event.params.userId}`,
          error,
      );
    }
  }
});

exports.fixUserTimestamps = onRequest(async (req, res) => {
  try {
    const users = await db.collection("users").get();
    const batch = db.batch();
    let updated = 0;

    users.forEach((doc) => {
      const data = doc.data();
      if (!data.createdAt) {
        batch.update(doc.ref, {
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
        updated++;
      }
    });

    if (updated > 0) {
      await batch.commit();
      res.send(`Updated ${updated} user documents with timestamps.`);
    } else {
      res.send("All user documents already have timestamps.");
    }
  } catch (error) {
    logger.error("Error fixing timestamps:", error);
    res.status(500).send("Error: " + error.message);
  }
});
