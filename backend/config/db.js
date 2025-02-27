const mongoose = require("mongoose");
const colors = require("colors");

const connectDB = async () => {
  try {
    // Ensure MONGO_URI is defined in environment variables
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI is not defined in the environment variables.");
      process.exit(1); // Exit the application if MONGO_URI is missing
    }

    // Connect to MongoDB using the URI from the environment variable
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.error(`Error: ${error.message}`.red.bold);
    process.exit(1); // Exit with a non-zero status code to indicate an error
  }
};

module.exports = connectDB;
