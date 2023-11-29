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
const MemoryAlbum = require('../model/memories.album.model');

exports.deleteImages = async (req, res) => {
    try {
        const { chooseModel, imageId } = req.body;

        if (typeof chooseModel !== 'number' || ![0, 1].includes(chooseModel)) {
            return res.status(400).json(messageResponse.error(400, 'Invalid value for chooseModel.'));
        }

        if (!Array.isArray(imageId) || imageId.length === 0 || imageId.some(id => typeof id !== 'string')) {
            return res.status(400).json(messageResponse.error(400, 'Invalid value for imageId.'));
        }

        let Model;

        if (chooseModel === 0) {
            Model = Upload;
        } else if (chooseModel === 1) {
            Model = MemoryAlbum;
        }

        if (!Model) {
            return res.status(400).json(messageResponse.error(400, 'Invalid value for chooseModel.'));
        }

        // Find images in the chosen model with the provided imageId(s)
        const images = await Model.find({ _id: { $in: imageId } });

        // Filter out images that are already deleted
        const notDeletedImages = images.filter(image => !image.isDeleted);

        if (notDeletedImages.length === 0) {
            return res.status(404).json(messageResponse.error(404, 'No valid images found with the provided imageId(s).'));
        }

        // Update isDeleted to true for the notDeletedImages
        await Model.updateMany(
            { _id: { $in: notDeletedImages.map(image => image._id) } },
            { $set: { isDeleted: true } }
        );

        res.status(200).json(messageResponse.success(200, 'Images deleted successfully'));
    } catch (error) {
        console.error(error);
        res.status(500).json(messageResponse.error(500, 'An error occurred while deleting images.'));
    }
};


exports.uploadMemoryAlbum = async (req, res) => {
    try {
        const { passingDate, dateOfBirth, image_type } = req.body;
        const userId = req.body.id;
        if (!req.files || req.files.length === 0) {
            return res.status(400).json(messageResponse.error(400, 'Please select at least one image.'));
        }
        const uploads = req.files.map(file => ({
            user: userId,
            passingDate,
            dateOfBirth,
            imagePath: file.path,
            image_type
        }));

        const saveUploads = await MemoryAlbum.create(uploads);

        res.status(200).json(messageResponse.success(200, 'Memory album uploaded successfully', saveUploads));
    } catch (error) {
        console.error(error);
        res.status(500).json(messageResponse.error(500, 'An error occurred while uploading the memory album'));
    }
};

exports.uploadImage = async (req, res) => {
    try {
        const userId = req.body.id;
        const { name, description, image_type } = req.body;
        if (!req.files || req.files.length === 0) {
            return res.status(400).json(messageResponse.error(400, 'Please select at least one image.'));
        }

        const uploads = req.files.map(file => ({
            name,
            description,
            imagePath: file.path,
            user: userId, // Pass the userId here
            image_type
        }));

        const saveUploads = await Upload.create(uploads);

        res.status(200).json(messageResponse.success(200, 'Images uploaded successfully', saveUploads));
    } catch (error) {
        console.error(error);
        res.status(500).json(messageResponse.error(500, 'An error occurred while uploading images'));
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
        const imageType = req.body.chooseModel; 
        let userImages;

        if (imageType === 0) {
            userImages = await Upload.find({ user: userId });
        } else if (imageType === 1) {
            userImages = await MemoryAlbum.find({ user: userId });
        } else {
            return res.status(400).json(messageResponse.error(400, 'Invalid selection.'));
        }

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
        const chooseModel = req.body.chooseModel; // Assuming chooseModel is part of the request body

        let allImages;

        if (chooseModel === 0) {
            allImages = await Upload.find({ image_type: { $in: [0, 1] } });
        } else if (chooseModel === 1) {
            allImages = await MemoryAlbum.find({ image_type: { $in: [0, 1] } });
        } else {
            return res.status(400).json(messageResponse.error(400, 'Invalid value for chooseModel.'));
        }

        if (!allImages || allImages.length === 0) {
            return res.status(404).json(messageResponse.error(404, 'No Images found'));
        }

        res.status(200).json(messageResponse.success(200, 'Images fetched successfully', allImages));
    } catch (error) {
        console.error(error);
        res.status(500).json(messageResponse.error(500, 'An Error occurred while Fetching Images'));
    }
};

exports.shareImage = async (req, res) => {
    const imageId = req.query.imageId;
    const authenticatedUserId = req.query.id;
    const userId = req.userId;
    const userEmail = req.body.email;
    console.log(authenticatedUserId);
    console.log("userId",userId);

    if (authenticatedUserId !== userId) {
        return res.status(403).json(messageResponse.error(403, 'You can only share that image which you have uploaded'));
    }

    try {
        // Check if the image exists
        const image = await Upload.findById(imageId);

        if (!image) {
            return res.status(404).json(messageResponse.error(404, 'Image not found'));
        }
        const loginPageUrl = 'localhost:3001/image';
        const additionalData = {
            imageId: imageId,
        };
        const queryParams = new URLSearchParams(additionalData);
        const urlWithQueryParams = `${loginPageUrl}?${queryParams.toString()}`;

        // Generate the QR code with the login page URL containing query parameters
        const qrCodeDataURL = await qrcode.toDataURL(urlWithQueryParams);

        // Save the QR code image to a file (optional)
        const filename = `${Date.now()}_qr.png`;
        const filePath = path.join(__dirname, '..', 'uploads', filename);
        await fs.writeFile(filePath, Buffer.from(qrCodeDataURL.split(',')[1], 'base64'));

        // Send the QR code image as an attachment in the email
        const qrCodes = [{ filename: filename, data: filePath }];
        
        await sendEmailURL(userEmail, qrCodes, urlWithQueryParams);

        // Send the QR code image as a response (optional)
        res.status(200).download(filePath);

    } catch (error) {
        console.error(error);
        res.status(500).json(messageResponse.error(500, 'An error occured while sharing image'));
    }
};
exports.sharedImage = async (req, res) => {
    const imageId = req.query.imageId;
    console.log(imageId);
    try {
        const image = await Upload.findById(imageId);
        if (!image) {
            return res.status(404).json(messageResponse.error(404, 'Image does not exist'));
        }

        res.status(200).json(messageResponse.success(200, 'Images fetched successfully',image));
    } catch (error) {
        console.error(error);
        res.status(500).json(messageResponse.error(500, 'Error while fetching image'));
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
