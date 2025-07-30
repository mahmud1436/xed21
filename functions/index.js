const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize admin SDK
admin.initializeApp();

const db = admin.firestore();

// Existing hello world function
exports.helloWorld = functions.https.onRequest((req, res) => {
  functions.logger.info("Hello from XED21!", {structuredData: true});
  res.send("Hello from Firebase Functions!");
});

// New function to handle user creation
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  try {
    // Check if user document already exists
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    if (!userDoc.exists) {
      // Create a basic user document if it doesn't exist
      await db.collection('users').doc(user.uid).set({
        email: user.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        userType: 'student', // Default type
        subscriptions: [],
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      functions.logger.log('Created user document for:', user.email);
    } else {
      // Update timestamp if document exists
      await db.collection('users').doc(user.uid).update({
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (error) {
    functions.logger.error('Error creating user document:', error);
  }
});

// Function to ensure all user documents have proper timestamps
exports.fixUserTimestamps = functions.https.onRequest(async (req, res) => {
  try {
    const users = await db.collection('users').get();
    const batch = db.batch();
    let updated = 0;
    
    users.forEach(doc => {
      const data = doc.data();
      if (!data.createdAt) {
        batch.update(doc.ref, {
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        updated++;
      }
    });
    
    if (updated > 0) {
      await batch.commit();
      res.send(`Updated ${updated} user documents with timestamps.`);
    } else {
      res.send('All user documents already have timestamps.');
    }
  } catch (error) {
    functions.logger.error('Error fixing timestamps:', error);
    res.status(500).send('Error: ' + error.message);
  }
});