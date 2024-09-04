const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {Client} = require("@elastic/elasticsearch");

admin.initializeApp(functions.config().firebase);

const env = functions.config();
const auth = {
  username: env.elasticsearch.username,
  password: env.elasticsearch.password,
};

const client = new Client({
  node: env.elasticsearch.url,
  auth: auth,
});
exports.creatInterviewPost = functions.firestore
    .document("interviews/{id}")
    .onCreate(async (snap, context) => {
      try {
        await client.index({
          index: "interviews",
          id: context.params.id,
          body: snap.data(),
        });
      } catch (error) {
        console.error("Error indexing document", error);
      }
    });

exports.updateInterviewPost = functions.firestore
    .document("interviews/{id}")
    .onUpdate(async (snap, context) => {
      try {
        await client.index({
          index: "interviews",
          id: context.params.id,
          body: snap.after.data(),
        });
      } catch (error) {
        console.error("Error updating document", error);
      }
    });

exports.deleteInterviewPost = functions.firestore
    .document("interviews/{id}")
    .onDelete((snap, context) => {
      try {
        client.delete({
          index: "interviews",
          id: context.params.id,
        });
      } catch (error) {
        console.error("Error deleting document", error);
      }
    });


exports.createCandidateInterviewPost = functions.firestore
    .document("candidate_interviews/{id}")
    .onCreate(async (snap, context) => {
      try {
        await client.index({
          index: "candidate_interviews",
          id: context.params.id,
          body: snap.data(),
        });
      } catch (error) {
        console.error("Error indexing document", error);
      }
    });

exports.updateCandidateInterviewPost = functions.firestore
    .document("candidate_interviews/{id}")
    .onUpdate(async (snap, context) => {
      try {
        await client.index({
          index: "candidate_interviews",
          id: context.params.id,
          body: snap.after.data(),
        });
      } catch (error) {
        console.error("Error updating document", error);
      }
    });

exports.deleteCandidateInterviewPost = functions.firestore
    .document("candidate_interviews/{id}")
    .onDelete((snap, context) => {
      try {
        client.delete({
          index: "candidate_interviews",
          id: context.params.id,
        });
      } catch (error) {
        console.error("Error deleting document", error);
      }
    });

client.ping({}, (error) => {
  if (error) {
    console.error("Elasticsearch is down!", error);
  } else {
    console.log("Elasticsearch is connected!");
  }
});
