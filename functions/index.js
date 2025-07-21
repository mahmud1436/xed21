const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// ✅ This uses both onRequest and logger
exports.helloWorld = onRequest((req, res) => {
  logger.info("Hello from XED21!", {structuredData: true});
  res.send("Hello from Firebase Functions!");
});
