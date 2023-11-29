const { body, validationResult } = require("express-validator");
exports.validateDeleteImage = [
  body("imageId").custom((value) => {
    if (!Array.isArray(value)) {
      throw new Error("Image Id must be in array format");
    }
    if (value.length === 0) {
      throw new Error("Image Id array should not be empty");
    }
    if (value.some((id) => typeof id !== "string")) {
      throw new Error("Image Ids must be strings");
    }
    return true;
  }),
  body("chooseModel")
    .isNumeric()
    .withMessage("Image type must be a number 0 or 1")
    .isIn([0, 1])
    .withMessage("give 0 for normal image and 1 for album images")
    .toInt(),
];

exports.validateUploadImageFields = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),

  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .isString()
    .withMessage("Description must be a string"),
];

exports.validateUserImages = [
  body("chooseModel")
    .isNumeric()
    .withMessage("Image type must be a number 0 or 1")
    .isIn([0, 1])
    .withMessage("give 0 for normal image and 1 for album images")
    .toInt(),
];

exports.validateUploadMemoryAlbumFields = [
  body("passingDate")
    .notEmpty()
    .withMessage("Passing date is required")
    .isISO8601()
    .toDate()
    .withMessage("Invalid passing date format"),

  body("dateOfBirth")
    .notEmpty()
    .withMessage("Date of birth is required")
    .isISO8601()
    .toDate()
    .withMessage("Invalid date of birth format"),
  body("image_type")
    .isNumeric()
    .withMessage("Image type must be a number 0 or 1")
    .isIn([0, 1])
    .withMessage("give 0 for public and 1 for private")
    .toInt(),
];

exports.validateShareImageEmail = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address"),
];

exports.validateUserSignupInput = [
  body("name")
    .notEmpty()
    .withMessage("name is required")
    .trim()
    .isAlpha()
    .withMessage("Name can only contain alphabetic characters"),

  body("email")
    .notEmpty()
    .withMessage("email is required")
    .trim()
    .isEmail()
    .withMessage("Invalid email format"),

  body("password")
    .notEmpty()
    .withMessage("password is required")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),

  body("address")
    .notEmpty()
    .withMessage("address is required")
    .trim()
    .isLength({ min: 4, max: 255 }),
];

exports.validateQrInput = [
  body("qrText")
    .trim()
    .isString()
    .not()
    .isEmpty()
    .withMessage("qrText is required"),
];

exports.validateLoginInput = [
  body("email")
    .notEmpty.apply()
    .withMessage("email is required")
    .trim()
    .isEmail()
    .withMessage("Invalid email format"),

  body("password").notEmpty().withMessage("password is required").trim(),
];

exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
