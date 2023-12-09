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
    createAlbumValidation,
    myAlbumValidation,
    handleValidationErrors,
    shareAlbumValidation,
    deleteImageAlbumValidation,
    validateDeleteImage } = require('../middleware/validatInput');
const userRoutes = express.Router();

//user routes
userRoutes.post("/signup",validateUserSignupInput, handleValidationErrors, getUser.signup);
userRoutes.post("/login", validateLoginInput, handleValidationErrors, getUser.login);
userRoutes.post('/logout', isAuth,getUser.logout)
userRoutes.put("/updateUser/:userId", isAuth,getUser.updateUser)

//QR routes
userRoutes.get("/myqrcodes/:userId", isAuth, qrController.getUserQRCodes);
userRoutes.delete('/deleteqrcode/:qrcodeId', isAuth, getUser.deleteUserQRCode); 
userRoutes.get('/myqrcodes', isAuth, qrController.getUserQRCodes);

// uploads route
userRoutes.post('/upload-image', isAuth, upload.array('imagePath', 5),validateUploadImageFields, handleValidationErrors, getUser.uploadImage);

//Image routes
userRoutes.get('/getAllImages', isAuth, getUser.getAllImages)
userRoutes.get('/myImages', isAuth, getUser.getUserUploadedImages)
userRoutes.post('/imageLikes', isAuth, getUser.likeImage)
userRoutes.post('/imageComments', isAuth, getUser.commentImage)
userRoutes.post('/deleteImage', isAuth, validateDeleteImage, handleValidationErrors, getUser.deleteImages )
userRoutes.post('/image', isAuth,getUser.sharedImage)
userRoutes.post('/shareImage', isAuth,validateShareImageEmail,handleValidationErrors,getUser.shareImage);

// Album routes
userRoutes.post('/create-album', isAuth, createAlbumValidation, handleValidationErrors, getUser.addImageInAlbum)
userRoutes.post('/my-album', isAuth, myAlbumValidation, handleValidationErrors, getUser.getAlbum)
userRoutes.post('/delete-image-album', isAuth, deleteImageAlbumValidation, handleValidationErrors, getUser.deleteImageFromAlbum)
userRoutes.post('/share-album', isAuth, shareAlbumValidation, handleValidationErrors, getUser.shareAlbum),
userRoutes.get('/view-album', isAuth, getUser.viewSharedAlbum)

module.exports = userRoutes;