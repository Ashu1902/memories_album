const express = require('express');
const getUser = require('../controllers/user-controller');
const {isAuth} = require('../middleware/isAuth');
const qrController = require('../controllers/qrController');
const upload = require('../middleware/upload')
const { 
    validateUserSignupInput, 
    validateLoginInput,
    validateShareImageEmail,
    validateUploadImageFields, 
    handleValidationErrors,
    validateUserImages,
    validateDeleteImage,
    validateUploadMemoryAlbumFields } = require('../middleware/validatInput');
const userRoutes = express.Router();

userRoutes.post("/signup",validateUserSignupInput, handleValidationErrors, getUser.signup);
userRoutes.post("/login", validateLoginInput, handleValidationErrors, getUser.login);
userRoutes.get("/myqrcodes/:userId", isAuth, qrController.getUserQRCodes);
userRoutes.put("/updateUser/:userId", isAuth,getUser.updateUser)
userRoutes.delete('/deleteqrcode/:qrcodeId', isAuth, getUser.deleteUserQRCode); 
userRoutes.get('/myqrcodes', isAuth, qrController.getUserQRCodes);
userRoutes.post('/upload-image', upload.array('imagePath', 5), validateUploadImageFields, handleValidationErrors, getUser.uploadImage);
userRoutes.post('/upload-memories', upload.array('imagePath', 5), validateUploadMemoryAlbumFields, handleValidationErrors, getUser.uploadMemoryAlbum);
userRoutes.post('/logout', isAuth,getUser.logout)
userRoutes.post('/shareImage',validateShareImageEmail,handleValidationErrors, isAuth,getUser.shareImage);
userRoutes.get('/image', getUser.sharedImage)
userRoutes.get('/getAllImages',validateUserImages, handleValidationErrors, isAuth, getUser.getAllImages)
userRoutes.get('/myImages', validateUserImages, handleValidationErrors, isAuth, getUser.getUserUploadedImages)
userRoutes.post('/imageLikes', isAuth, getUser.likeImage)
userRoutes.post('/imageComments', isAuth, getUser.commentImage)
userRoutes.post('/deleteImage',validateDeleteImage, handleValidationErrors, isAuth, getUser.deleteImages )

module.exports = userRoutes;