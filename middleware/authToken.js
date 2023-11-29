const jwt = require("jsonwebtoken");
require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;
exports.generateToken = (email, userId) => {
  return jwt.sign({ email, userId }, SECRET_KEY, { expiresIn: "1d" });
};
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return error;
  }
};
exports.logoutToken = () => {
  return jwt.sign({  }, SECRET_KEY, { expiresIn: "1s"})
}