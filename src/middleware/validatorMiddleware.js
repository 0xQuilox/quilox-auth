/**
 * @file validatorMiddleware.js
 * @description A well-documented Express.js middleware for data validation.
 * This middleware uses the Joi library to validate request data against predefined schemas.
 *
 * This version of the file has been corrected to act as a reusable module,
 * exporting the `validate` function for use in other files like `userRoutes.js`.
 */

const Joi = require('joi');

// =========================================================================
// 1. The Core Validation Middleware Function
// =========================================================================

/**
 * @function validate
 * @param {object} schemas - An object where keys are 'body', 'params', or 'query',
 * and values are Joi schemas to validate against.
 * @returns {function} An Express.js middleware function.
 * @description A higher-order function that takes a validation schema and returns
 * the actual middleware. This allows for flexible and reusable validation.
 */
function validate(schemas) {
  // Return the middleware function itself.
  return (req, res, next) => {
    // Determine the type of validation requested (body, params, query).
    const validationTargets = Object.keys(schemas);

    // Array to collect all validation errors.
    const errors = [];

    // Iterate over each validation target to check for errors.
    validationTargets.forEach(target => {
      const schema = schemas[target];
      const data = req[target]; // Get the data to validate (e.g., req.body).

      // Use Joi's `validate` method to check the data against the schema.
      const { error } = schema.validate(data, {
        abortEarly: false,     // Return all errors found, not just the first one.
        allowUnknown: false,   // Do not allow keys that are not defined in the schema.
      });

      // If errors are found, add them to our errors array.
      if (error) {
        errors.push({
          location: target,
          details: error.details.map(d => d.message),
        });
      }
    });

    // If any errors were collected, respond with a 400 Bad Request and the error details.
    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors,
      });
    }

    // If validation passes, proceed to the next middleware or route handler.
    next();
  };
}

// =========================================================================
// 2. Export the Middleware
// =========================================================================

/**
 * @exports {function} The validate middleware function.
 * This is the crucial line that makes the function available for other files to use.
 */
module.exports = validate;