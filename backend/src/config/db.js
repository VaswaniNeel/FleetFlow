const mongoose = require('mongoose');

async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI not set in environment');
  }
  await mongoose.connect(uri, { autoIndex: true });
}

module.exports = connectDb;
