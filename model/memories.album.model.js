const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const memoryAlbumSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    passingDate: {
        type: Date,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    imagePath: String,
    image_type: {
        type: Number,
        enum: [0, 1],
        default: 0
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MemoryAlbum', memoryAlbumSchema);
