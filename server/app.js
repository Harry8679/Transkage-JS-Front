const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {})
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error(err));

app.get("/", (req, res) => res.send("API Running"));

module.exports = app;

if (require.main === module) {
    app.listen(5000, () => console.log("Server running on port 5000"));
}