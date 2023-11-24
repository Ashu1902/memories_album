const mongoose = require('mongoose');
const Schema = mongoose.Schema;
module.exports = (mongoose) => {
    const userSchema = new mongoose.Schema(
      {
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
    }
    );
    return mongoose.model("User", userSchema);
  };
  