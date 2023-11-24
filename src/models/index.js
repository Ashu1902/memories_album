const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const { config } = require('@config/index');
const mongoURL = config.databaseURL;


mongoose.set("strictQuery", false);

mongoose
  .connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(`Connected to MongoDB`);
  })
  .catch((error) => {
    console.error(`Could not connect to MongoDB:\n${error}`);
  });

  module.exports = {

    User: mongoose.models.User || require("./user.model")(mongoose),
  };