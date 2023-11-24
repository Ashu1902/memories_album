require("module-alias/register");
const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const { config } = require('@config/index');
require('./src/models/index');
app.get("/", (req, res) => {
    res.send("App started...");
});

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.listen(config.port, () => console.log(`Listening on Port: ${config.port}`));
