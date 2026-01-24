const express = require("express")
const router = express.Router();
const authController = require("../controllers/authController")

let users = [];
let id = 1;

router.post('/register', authController.register) 
// execute the func only when the req is on /register
// in middlewares we dont define paths and let the function run for every incoming req.

router.post('/login', authController.login);

module.exports = router;