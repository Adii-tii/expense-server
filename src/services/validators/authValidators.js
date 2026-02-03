const {body} = require("express-validator");

const authValidators = {
    loginValidator: [
        body('email')
        .trim()
        .notEmpty().withMessage('Email is required.')
        .isEmail().withMessage('Please enter a valid email address.'),

        body('password')
        .trim()
        .notEmpty().withMessage('Password is required.')
    ],

    registerValidator: [
        body('username').trim().notEmpty().withMessage('Username is required.'),

        body('email')
        .trim()
        .notEmpty().withMessage('Email is required.')
        .isEmail().withMessage('Please enter a valid email address.'),

        body('password')
        .trim()
        .notEmpty().withMessage('Password is required.')
        .isLength({ min: 3 }).withMessage('Password must be at least 3 characters long.')
    ]
}

module.exports = authValidators;