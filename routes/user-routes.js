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
    validateDeleteImage } = require('../middleware/validatInput');
const userRoutes = express.Router();

userRoutes.post("/signup",validateUserSignupInput, handleValidationErrors, getUser.signup);
userRoutes.post("/login", validateLoginInput, handleValidationErrors, getUser.login);
userRoutes.get("/myqrcodes/:userId", isAuth, qrController.getUserQRCodes);
userRoutes.put("/updateUser/:userId", isAuth,getUser.updateUser)
userRoutes.delete('/deleteqrcode/:qrcodeId', isAuth, getUser.deleteUserQRCode); 
userRoutes.get('/myqrcodes', isAuth, qrController.getUserQRCodes);
userRoutes.post('/upload-image', isAuth, upload.array('imagePath', 5),validateUploadImageFields, handleValidationErrors, getUser.uploadImage);
userRoutes.post('/logout', isAuth,getUser.logout)
userRoutes.post('/shareImage', isAuth,validateShareImageEmail,handleValidationErrors,getUser.shareImage);
userRoutes.post('/image', isAuth,getUser.sharedImage)
userRoutes.get('/getAllImages', isAuth, getUser.getAllImages)
userRoutes.get('/myImages', isAuth, getUser.getUserUploadedImages)
userRoutes.post('/imageLikes', isAuth, getUser.likeImage)
userRoutes.post('/imageComments', isAuth, getUser.commentImage)
userRoutes.post('/deleteImage', isAuth, validateDeleteImage, handleValidationErrors, getUser.deleteImages )

module.exports = userRoutes;