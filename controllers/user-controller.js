const User = require('../model/User');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/authToken')
const jwt = require('jsonwebtoken');
const messageResponse = require('../Responses/messageRespons');
const QRCode = require('../model/QRCode');
const fs = require('fs').promises;
const qrcode = require('qrcode');
const path = require('path');
const Upload = require('../model/Upload')
const { sendEmailURL } = require('../services/emailServices');
const MemoriesAlbum = require('../model/memories.album.model');

exports.shareImage = async (req, res) => {
    const albumId = req.body.albumId;
    const imageId = req.body.imageId;
    const authenticatedUserId = req.body.id;
    const userId = req.userId;
    const userEmail = req.body.email;

    if (authenticatedUserId !== userId) {
        return res.status(403).json(messageResponse.error(403, 'You can only share images that you have uploaded'));
    }
    try {
        let link = '';
        if (albumId) {
            const album = await MemoriesAlbum.findById(albumId).populate('images');
            if (!album) {
                return res.status(404).json(messageResponse.error(404, 'Album not found'));
            }
            // Check if any image in the album is not deleted
            const isAlbumValid = album.images.some(image => !image.isDeleted);
            if (!isAlbumValid) {
                return res.status(400).json(messageResponse.error(400, 'All images in the album are deleted'));
            }
            const loginPageUrl = 'localhost:3000/user/image';
            const additionalData = {
                albumId: albumId,
            };
            const queryParams = new URLSearchParams(additionalData);
            const urlWithQueryParams = `${loginPageUrl}?${queryParams.toString()}`;
            link = urlWithQueryParams;
            const qrCodeDataURL = await qrcode.toDataURL(urlWithQueryParams);
            const qrCodeDirectory = path.join(__dirname, '..', 'uploads', 'qrcode');
            await fs.mkdir(qrCodeDirectory, { recursive: true });
            const qrCodeFileName = `${Date.now()}_qr_album.png`;
            const qrCodeFilePath = path.join(qrCodeDirectory, qrCodeFileName);
            await fs.writeFile(qrCodeFilePath, Buffer.from(qrCodeDataURL.split(',')[1], 'base64'));
            await sendEmailURL(userEmail, [{ filename: qrCodeFileName, data: qrCodeFilePath, cid: qrCodeFileName }], link);
        } else if (imageId) {
            // Share a single image
            const image = await Upload.findById(imageId);
            if (!image) {
                return res.status(404).json(messageResponse.error(404, 'Image not found'));
            }
            // Check if the image is not deleted
            if (image.isDeleted) {
                return res.status(400).json(messageResponse.error(400, 'you can not share the deleted image'));
            }
            const loginPageUrl = 'localhost:3000/user/image';
            const additionalData = {
                imageId: imageId,
            };
            const queryParams = new URLSearchParams(additionalData);
            const urlWithQueryParams = `${loginPageUrl}?${queryParams.toString()}`;
            link = urlWithQueryParams;
            const qrCodeDataURL = await qrcode.toDataURL(urlWithQueryParams);
            const qrCodeDirectory = path.join(__dirname, '..', 'uploads', 'qrcode');
            await fs.mkdir(qrCodeDirectory, { recursive: true });
            const qrCodeFileName = `${Date.now()}_qr.png`;
            const qrCodeFilePath = path.join(qrCodeDirectory, qrCodeFileName);
            await fs.writeFile(qrCodeFilePath, Buffer.from(qrCodeDataURL.split(',')[1], 'base64'));
            await sendEmailURL(userEmail, [{ filename: qrCodeFileName, data: qrCodeFilePath, cid: qrCodeFileName }], link);
        } else {
            return res.status(400).json(messageResponse.error(400, 'Missing required parameters'));
        }
        res.status(200).json(messageResponse.success(200, 'QR code and link sent successfully', { link: link }));
    } catch (error) {
        console.error(error);
        res.status(500).json(messageResponse.error(500, 'An error occurred while sharing images'));
    }
};

exports.uploadImage =async (req, res) => {
    try {
        const userId = req.userId;
        const { name, description, image_type, albumName, passingDate } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json(messageResponse.error(400, 'Please select at least one image.'));
        }
        // Check if an album with the same name already exists for the user
        let existingAlbum = await MemoriesAlbum.findOne({ albumName, user: userId });
        if (!existingAlbum) {
            // If no existing album, create a new one
            existingAlbum = await MemoriesAlbum.create({
                albumName,
                passingDate,
                user: userId
            });
        }
        // Create uploads in the Upload model
        const savedUploads = await Upload.create(req.files.map(file => ({
            name,
            description,
            imagePath: file.path,
            user: userId,
            image_type,
            albumName,
            passingDate
        })));
        // Extract the IDs of the saved uploads
        const uploadIds = savedUploads.map(upload => upload._id);
        // Add the IDs of the new uploads to the existing album's images array
        existingAlbum.images = [...existingAlbum.images, ...uploadIds];
        await existingAlbum.save();
        res.status(200).json(messageResponse.success(200, 'Images uploaded to the album successfully', existingAlbum));
    } catch (error) {
        console.error(error);
        res.status(500).json(messageResponse.error(500, 'An error occurred while uploading images and updating album'));
    }
};

exports.deleteImages = async (req, res) => {
    try {
        const { imageId } = req.body;

        if (!Array.isArray(imageId) || imageId.length === 0 || imageId.some(id => typeof id !== 'string')) {
            return res.status(400).json(messageResponse.error(400, 'Invalid value for imageId.'));
        }

        // Find images in the Upload model with the provided imageId(s)
        const images = await Upload.find({ _id: { $in: imageId } });
        // Filter out images that are already deleted
        const notDeletedImages = images.filter(image => !image.isDeleted);
        if (notDeletedImages.length === 0) {
            return res.status(404).json(messageResponse.error(404, 'No valid images found with the provided imageId(s).'));
        }

        // Update isDeleted to true for the notDeletedImages in the Upload model
        await Upload.updateMany(
            { _id: { $in: notDeletedImages.map(image => image._id) } },
            { $set: { isDeleted: true } }
        );

        // Delete images from the local directory
        const uploadDirectory = path.join(__dirname, '..'); // Adjust the path as needed

        for (const image of notDeletedImages) {
            const imagePath = path.join(uploadDirectory, image.imagePath);
            
            try {
                // Attempt to unlink (delete) the file
                await fs.unlink(imagePath);
            } catch (error) {
                // Handle error (e.g., log it), but continue with other images
                console.error(`Error deleting file ${imagePath}: ${error.message}`);
            }
        }

        res.status(200).json(messageResponse.success(200, 'Images deleted successfully'));
    } catch (error) {
        console.error(error);
        res.status(500).json(messageResponse.error(500, 'An error occurred while deleting images.'));
    }
};

exports.commentImage = async (req, res) => {
    try {
        const imageId = req.query.imageId;
        const userId = req.userId;
        const commentText = req.body.commentText;

        // Check if the image exists
        const image = await Upload.findById(imageId);
        if (!image) {
            return res.status(404).json(messageResponse.error(404, 'Image not found'));
        }

        // Add the user's comment to the image
        const newComment = {
            user: userId,
            text: commentText
        };
        image.comments.push(newComment);
        await image.save();

        res.status(200).json(messageResponse.success(200, 'Comment added successfully', newComment));
    } catch (error) {
        console.error(error);
        res.status(500).json(messageResponse.error(500, 'An error occurred while adding the comment'));
    }
};

exports.likeImage = async (req, res) => {
    try {
        const imageId = req.query.imageId;
        const userId = req.userId;

        // Check if the image exists
        const image = await Upload.findById(imageId);
        if (!image) {
            return res.status(404).json(messageResponse.error(404, 'Image not found'));
        }

        // Check if the user has already liked the image
        if (image.likes.some(like => like.user.toString() === userId)) {
            return res.status(400).json(messageResponse.error(400, 'You have already liked this image.'));
        }

        // Add the user's like to the image
        image.likes.push({ user: userId });
        await image.save();

        res.status(200).json(messageResponse.success(200, 'Image liked successfully', image));
    } catch (error) {
        console.error(error);
        res.status(500).json(messageResponse.error(500, 'An error occurred while liking the image'));
    }
};

exports.getUserUploadedImages = async (req, res) => {
    try {
        const userId = req.userId;
        const userImages = await Upload.find({ user: userId });  
        if (!userImages || userImages.length === 0) {
            return res.status(404).json(messageResponse.error(404, 'No images uploaded by you.'));
        }
        res.status(200).json(messageResponse.success(200, 'Images fetched successfully', userImages));
    } catch (error) {
        console.error(error);
        res.status(500).json(messageResponse.error(500, 'An error occurred while fetching your uploaded images.'));
    }
};

exports.getAllImages = async (req, res) => {
    try {
        const allImages = await Upload.find({ image_type: { $in: [0] } });
        if (!allImages || allImages.length === 0) {
            return res.status(404).json(messageResponse.error(404, 'No Images found'));
        }
        res.status(200).json(messageResponse.success(200, 'Images fetched successfully', allImages));
    } catch (error) {
        console.error(error);
        res.status(500).json(messageResponse.error(500, 'An Error occurred while Fetching Images'));
    }
};

exports.sharedImage = async (req, res) => {
    const imageId = req.query.imageId;
    const albumId = req.query.albumId;

    try {
        if (imageId) {
            const image = await Upload.findById(imageId);
            if (!image) {
                return res.status(404).json(messageResponse.error(404, 'Image does not exist'));
            }

            res.status(200).json(messageResponse.success(200, 'Image fetched successfully', image));
        } else if (albumId) {
            const album = await MemoriesAlbum.findById(albumId).populate('images');
            if (!album) {
                return res.status(404).json(messageResponse.error(404, 'Album not found'));
            }
            // Check if any image in the album is not deleted
            const validImages = album.images.filter(image => !image.isDeleted);

            if (validImages.length === 0) {
                return res.status(404).json(messageResponse.error(404, 'No valid images found in the album'));
            }

            res.status(200).json(messageResponse.success(200, 'Images from album fetched successfully', validImages));
        } else {
            return res.status(400).json(messageResponse.error(400, 'Missing required parameters'));
        }
    } catch (error) {
        console.error(error);
        res.status(500).json(messageResponse.error(500, 'Error while fetching images'));
    }
};


exports.deleteUserQRCode = async (req, res) => {
    try {
        const qrcodeId = req.params.qrcodeId;
        // Get the user ID from the authenticated user's token
        const userId = req.userId;
        const deletedQRCode = await QRCode.findByIdAndRemove(qrcodeId);
        if (!deletedQRCode) {
            return res.status(404).json(messageResponse.error(404, 'QR code not found'));
        }
        if (deletedQRCode.userId.toString() !== userId.toString()) {
            return res.status(403).json(messageResponse.error(403, 'You do not have permission to delete this QR code'));
        }
        res.status(200).json(messageResponse.success(200, 'QR code deleted successfully', { deletedQRCode }));
    } catch (error) {
        console.error(error);
        res.status(500).json(messageResponse.error(500, 'An error occurred'));
    }
};

exports.getUserQRCodes = async (req, res) => {
    try {
        const userIdParam = req.params.userId; // Get the user ID from request parameters
        const token = req.headers.authorization;
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        const userId = decodedToken.userId;
        // Check if the user ID from request parameters matches the authenticated user's ID
        if (userIdParam !== userId) {
            return res.status(403).json(messageResponse.error(403, 'Unauthorized access'));
        }
        // Find all QR codes associated with the user
        const qrCodes = await QRCode.find({ userId: userId });
        // Return the list of QR codes in the response
        res.status(200).json(messageResponse.success(200, 'User QR codes fetched successfully', qrCodes));
    } catch (error) {
        console.error(error);
        res.status(500).json(messageResponse.error(500, 'An error occurred'));
    }
};

exports.updateUser = async (req, res) => {
    try {
        const fieldsToUpdate = req.body;
        const userIdParam = req.params.userId; // Get the user ID from request parameters
        const token = req.headers.authorization;
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        const userId = decodedToken.userId;
        // Check if the user ID from request parameters matches the authenticated user's ID
        if (userIdParam !== userId) {
            return res.status(403).json(messageResponse.error(403, 'Unauthorized access'));
        }
        // Check if a new password is provided in the request
        if (fieldsToUpdate.password) {
            // Hash the new password using bcrypt
            const hashedPassword = await bcrypt.hash(fieldsToUpdate.password, 12);
            // Update the 'password' field in 'fieldsToUpdate' with the hashed password
            fieldsToUpdate.password = hashedPassword;
        }
        // Prevent email update and send a message
        if (fieldsToUpdate.email) {
            return res.status(400).json(messageResponse.error(400, 'You cannot update your email address.'));
        }
        const updatedUser = await User.findByIdAndUpdate(userId, { $set: fieldsToUpdate });
        if (!updatedUser) {
            return res.status(404).json(messageResponse.error(404, 'User not found'));
        }
        res.status(200).json(messageResponse.success(200, 'Fields updated successfully', updatedUser));
    } catch (error) {
        console.error(error);
        res.status(500).json(messageResponse.error(500, 'An error occurred'));
    }
};

exports.signup = async (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email.toLowerCase();
    const password = req.body.password;
    const address = req.body.address;
    try {
        const find = await User.findOne({ email: email });
        if (find && find.email === email) {
            return res.status(401).json(messageResponse.error(401, 'A user with this email is already registered.'));
        }
        const hashedPw = await bcrypt.hash(password, 12);
        const user = new User({
            name: name,
            email: email,
            password: hashedPw,
            address: address
        });
        const result = await user.save();
        res.status(201).json(messageResponse.success(201, 'User created!', { userId: result._id }));
    } catch (err) {
        console.error(err);
        res.status(500).json(messageResponse.error(500, 'An error occurred'));
    }
};

exports.login = async (req, res, next) => {
    const email = req.body.email.toLowerCase();
    const password = req.body.password;
    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(401).json(messageResponse.error(401, 'A user with this email could not be found.'));
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            return res.status(401).json(messageResponse.error(401, 'Wrong password!'));
        }
        const userId = user._id;
        const token = generateToken(email, userId);
        user.isLoggedIn = 1;
        user.token = token;
        await user.save();
        res.status(200).json(messageResponse.success(200, 'Login successful!', { userId: user._id, token }));
    } catch (err) {
        console.error(err);
        res.status(500).json(messageResponse.error(500, 'An error occurred'));
    }
};

exports.logout = async (req, res) => {
    const userId = req.userId;
    try {
        const user = await User.findById(userId);
        user.token = null;
        await user.save();
        res.status(200).json(messageResponse.success(200, 'User logged out successfully'));
    } catch (err) {
        console.error(err);
        res.status(500).json(messageResponse.error(500, 'An error occurred while loging out'));
    }
};
