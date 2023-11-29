const express = require('express');
const multer = require('multer');
const { validateQrInput, handleValidationErrors } = require('../middleware/validatInput');
const qrController = require('../controllers/qrController');
const { isAuth } = require('../middleware/isAuth');
const qrRoutes = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

qrRoutes.post('/generate/:userId', isAuth, validateQrInput, handleValidationErrors, upload.single('qrText'), qrController.generate);
qrRoutes.post('/read', isAuth, upload.single('qrImage'), qrController.read);

module.exports = qrRoutes;
    