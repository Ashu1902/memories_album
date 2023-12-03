const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const memoriesAlbumSchema = new Schema({
    albumName: {
        type: String,
        required: true
    },
    images: [{
        type: Schema.Types.ObjectId,
        ref: 'Upload',
        required: true
    }],
    passingDate: { 
        type: Date,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MemoriesAlbum', memoriesAlbumSchema);
