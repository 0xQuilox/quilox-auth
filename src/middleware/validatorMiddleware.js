/**
 * @file validatorMiddleware.js
 * @description Joi-based validation middleware with reusable auth schemas.
 */

const Joi = require('joi');

// -------------------------------------------------------------------
// Generic validate middleware
// -------------------------------------------------------------------
function validate(schemas) {
  return (req, res, next) => {
    const targets = Object.keys(schemas);
    const errors = [];

    for (const target of targets) {
      const schema = schemas[target];
      const data = req[target];
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push({
          location: target,
          details: error.details.map((d) => d.message),
        });
      } else if (value && typeof value === 'object') {
        // Use sanitized value (stripUnknown)
        req[target] = value;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors,
      });
    }
    return next();
  };
}

// -------------------------------------------------------------------
// Reusable schemas (library-grade)
// -------------------------------------------------------------------
const schemas = {
  register: Joi.object({
    email: Joi.string().email().trim().lowercase().required(),
    password: Joi.string().min(8).max(128).required(),
    role: Joi.string().valid('user', 'editor', 'admin', 'viewer').default('user'),
    username: Joi.string().alphanum().min(3).max(30), // optional, for userRoutes compat
  }),
  login: Joi.object({
    email: Joi.string().email().trim().lowercase().required(),
    password: Joi.string().required(),
  }),
  profileUpdate: Joi.object({
    email: Joi.string().email().trim().lowercase(),
    username: Joi.string().alphanum().min(3).max(30),
  }).min(1),
  passwordChange: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).max(128).required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).messages({
      'any.only': 'confirmPassword must match newPassword',
    }),
  }),
  userIdParam: Joi.object({
    id: Joi.string().required(), // accepts ObjectId hex or UUID
  }),
};

// Prebuilt middlewares for authRoutes ergonomics
const validateUserRegistration = validate({ body: schemas.register });
const validateUserLogin = validate({ body: schemas.login });
const validateProfileUpdate = validate({ body: schemas.profileUpdate });
const validatePasswordChange = validate({ body: schemas.passwordChange });

module.exports = validate;
module.exports.validate = validate;
module.exports.schemas = schemas;
module.exports.validateUserRegistration = validateUserRegistration;
module.exports.validateUserLogin = validateUserLogin;
module.exports.validateProfileUpdate = validateProfileUpdate;
module.exports.validatePasswordChange = validatePasswordChange;
