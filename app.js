const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/user-routes');
const adminRoutes = require('./routes/admin-routes');
const qrcodeRoute = require('./routes/qr-routes');
const cors = require('cors')
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.use(express.static('uploads'))
app.use("/admin", adminRoutes);
app.use("/user", userRoutes);
app.use('/user/qrcode', qrcodeRoute);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
}); 

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    app.listen(3000);
    console.log("Connected to the Database and listening on the port 3000");
  } catch (err) {
    console.error(err);
  }
}
startServer();