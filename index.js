// WEBBL Morph Serverless Function (ASYNC)
module.exports = async function handler(payload) {
  console.log("🦋 WEBBL Morph executed with payload:", payload);
  return {
    status: 200,
    timestamp: new Date().toISOString(),
    message: "Hello from WEBBL Morph!",
    input: payload
  };
};
