const express = require("express")
const router = express.Router();
const authController = require("../controllers/authController")
const validators = require("../services/validators/authValidators");

const { loginValidator, registerValidator } = validators;


router.post('/register', registerValidator, authController.register) 
// execute the func only when the req is on /register
// in middlewares we dont define paths and let the function run for every incoming req.
router.post('/login', loginValidator, authController.login);
router.get('/logout', authController.logout);
router.get('/get-user', authController.getUser);
router.post('/google-auth', authController.googleSso);
router.post('/valid-login', authController.hasPassword);
router.post('/generate-code', authController.generateCode);
router.post('/verify-code', authController.verifyCode);
router.post('/reset-password', authController.resetPassword);
    
module.exports = router;