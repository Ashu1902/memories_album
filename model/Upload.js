const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const uploadSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    albumName: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: true
    },
    passingDate: {
        type: Date, 
        required: false
    },
    imagePath: String,
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
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
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    comments: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User' 
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
