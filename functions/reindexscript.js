require('dotenv').config(); // .env dosyasını yükler

const admin = require("firebase-admin");
const {Client} = require("@elastic/elasticsearch");

admin.initializeApp();

const auth = {
  username: process.env.ELASTICSEARCH_USERNAME,
  password: process.env.ELASTICSEARCH_PASSWORD,
};

const client = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: auth,
});

async function indexAllDocuments() {
  const firestore = admin.firestore();
  const collections = ["interviews", "candidate_interviews"];

  for (const collectionName of collections) {
    const snapshot = await firestore.collection(collectionName).get();
    const bulkOps = [];

    snapshot.forEach((doc) => {
      bulkOps.push({index: {_index: collectionName, _id: doc.id}});
      bulkOps.push(doc.data());
    });

    if (bulkOps.length > 0) {
      await client.bulk({body: bulkOps});
      console.log(`Indexed all documents in collection: ${collectionName}`);
    }
  }
}

// Run this function manually
indexAllDocuments().catch(console.error);
