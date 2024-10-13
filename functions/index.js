const functions = require("firebase-functions");
const admin = require("firebase-admin");
// const { Client } = require("@elastic/elasticsearch");
const axios = require("axios");

admin.initializeApp(functions.config().firebase);

// const env = functions.config();
// const auth = {
//   username: env.elasticsearch.username,
//   password: env.elasticsearch.password,
// };

// const client = new Client({
//   node: env.elasticsearch.url,
//   auth: auth,
// });
// exports.creatInterviewPost = functions.firestore
//   .document("interviews/{id}")
//   .onCreate(async (snap, context) => {
//     try {
//       await client.index({
//         index: "interviews",
//         id: context.params.id,
//         body: snap.data(),
//       });
//     } catch (error) {
//       console.error("Error indexing document", error);
//     }
//   });

// exports.updateInterviewPost = functions.firestore
//   .document("interviews/{id}")
//   .onUpdate(async (snap, context) => {
//     try {
//       await client.index({
//         index: "interviews",
//         id: context.params.id,
//         body: snap.after.data(),
//       });
//     } catch (error) {
//       console.error("Error updating document", error);
//     }
//   });

// exports.deleteInterviewPost = functions.firestore
//   .document("interviews/{id}")
//   .onDelete((snap, context) => {
//     try {
//       client.delete({
//         index: "interviews",
//         id: context.params.id,
//       });
//     } catch (error) {
//       console.error("Error deleting document", error);
//     }
//   });

// exports.createCandidateInterviewPost = functions.firestore
//   .document("candidate_interviews/{id}")
//   .onCreate(async (snap, context) => {
//     try {
//       await client.index({
//         index: "candidate_interviews",
//         id: context.params.id,
//         body: snap.data(),
//       });
//     } catch (error) {
//       console.error("Error indexing document", error);
//     }
//   });

// exports.updateCandidateInterviewPost = functions.firestore
//   .document("candidate_interviews/{id}")
//   .onUpdate(async (snap, context) => {
//     try {
//       await client.index({
//         index: "candidate_interviews",
//         id: context.params.id,
//         body: snap.after.data(),
//       });
//     } catch (error) {
//       console.error("Error updating document", error);
//     }
//   });

// exports.deleteCandidateInterviewPost = functions.firestore
//   .document("candidate_interviews/{id}")
//   .onDelete((snap, context) => {
//     try {
//       client.delete({
//         index: "candidate_interviews",
//         id: context.params.id,
//       });
//     } catch (error) {
//       console.error("Error deleting document", error);
//     }
//   });

// client.ping({}, (error) => {
//   if (error) {
//     console.error("Elasticsearch is down!", error);
//   } else {
//     console.log("Elasticsearch is connected!");
//   }
// });

exports.triggerQuestionCreationOnCreate = functions.firestore
  .document("interviews/{id}")
  .onCreate(async (snap, context) => {
    try {
      const data = snap.data();

      // Check if the status is WAITING_FOR_QUESTION_CREATION
      if (data.status === "WAITING_FOR_QUESTION_CREATION") {
        await axios.post(
          "https://candidaite-api.vercel.app/create-dynamic-interview-questions",
          {
            timeout: 60000, // 60 seconds timeout
          }
        );
        console.log(
          "Triggered question creation for interview:",
          context.params.id
        );
      } else if (data.status === "WAITING_FOR_ANSWER_CREATION") {
        try {
          console.log("entry check: girdim");

          await axios.post(
            "https://candidaite-api.vercel.app/create-interview-answers",
            {
              timeout: 60000, // 60 seconds timeout
            }
          );
          console.log(
            "Triggered answer creation for interview:",
            context.params.id
          );
        } catch (axiosError) {
          handleAxiosError(axiosError, "create-interview-answers");
        }
      }
    } catch (error) {
      console.error("Error triggering question creation on create", error);
    }
  });

// New function for interviews update that triggers the API based on the updated status
exports.triggerStatusChangeOnUpdate = functions.firestore
  .document("interviews/{id}")
  .onUpdate(async (snap, context) => {
    try {
      const beforeData = snap.before.data();
      const afterData = snap.after.data();

      // Log the updated data for debugging purposes
      console.log("afterData check:", afterData);
      console.log("afterData.status check:", afterData.status);

      // Trigger API call based on updated status
      if (afterData.status === "WAITING_FOR_ANSWER_CREATION") {
        try {
          console.log("entry check: girdim");

          await axios.post(
            "https://candidaite-api.vercel.app/create-interview-answers",
            {
              timeout: 60000, // 60 seconds timeout
            }
          );
          console.log(
            "Triggered answer creation for interview:",
            context.params.id
          );
        } catch (axiosError) {
          handleAxiosError(axiosError, "create-interview-answers");
        }
      } else if (afterData.status === "WAITING_FOR_QUESTION_CREATION") {
        try {
          await axios.post(
            "https://candidaite-api.vercel.app/create-dynamic-interview-questions",
            {
              timeout: 60000, // 60 seconds timeout
            }
          );
          console.log(
            "Triggered question creation for interview:",
            context.params.id
          );
        } catch (axiosError) {
          handleAxiosError(axiosError, "create-dynamic-interview-questions");
        }
      }
    } catch (error) {
      console.error("Error triggering status change on update:", error);
    }
  });

// Helper function to handle axios-specific errors
const handleAxiosError = (error, apiEndpoint) => {
  if (error.response) {
    // The request was made, and the server responded with a status code
    console.error(
      `Error: API ${apiEndpoint} responded with status ${error.response.status}`
    );
    console.error("Response data:", error.response.data);
  } else if (error.request) {
    // The request was made, but no response was received
    console.error(`Error: No response received from API ${apiEndpoint}`);
    console.error("Request details:", error.request);
  } else {
    // Something else happened in setting up the request
    console.error(
      `Error in request setup for API ${apiEndpoint}:`,
      error.message
    );
  }
};
