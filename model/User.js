const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    address: {
        type: String,
        required: true,
        minlength: 5
    },
    token: {
        type: String,
        default: null
    },
    isLoggedIn: {
        type: Number,
        enum: [0 , 1],
        default: 0
    },
    qrCodes:[
        {
           type:Schema.Types.ObjectId,
           ref:'QRCode'      
        }
      ]
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
