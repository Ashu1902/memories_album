const { verifyToken } = require("./authToken");
const messageResponse = require('../Responses/messageRespons');
exports.isAuth = async (req, res, next) => {
    // Check if user is authenticated
    if (!req.headers.authorization) {
        return res.status(401).json(messageResponse.error(401, 'Authentication required'));
    }
    const token = req.headers.authorization;
    // Verify the token
    const decodedToken = verifyToken(token);
    if (!decodedToken.email) {
        return res.status(401).json(messageResponse.error(401, 'Invalid Token'));
    }
    req.email = decodedToken.email;
    req.userId = decodedToken.userId;   
    next();
};