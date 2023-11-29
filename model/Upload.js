const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const uploadSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imagePath: String, // New field to store the image path
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    image_type: {
        type: Number,
        enum: [0, 1],
        default: 0
    },
    likes: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User' // Reference to the User model for the user who made the comment
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    comments: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User' // Reference to the User model for the user who made the comment
        },
        text: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Upload', uploadSchema);
