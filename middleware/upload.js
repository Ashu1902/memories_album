const multer = require("multer");
const fs = require("fs");

// Define storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const albumName = req.body.albumName;
        const uploadPath = `uploads/albums/${albumName}/`;

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only images are allowed"), false);
    }
};

// Initialize multer
const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // 2mb file size limit
    fileFilter: fileFilter,
});

module.exports = upload;
