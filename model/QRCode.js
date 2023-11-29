const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
    filename: String,
    data: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
    },
});
const QRCodeModel = mongoose.model('QRCode', qrCodeSchema);

module.exports = QRCodeModel;
