const express = require("express");
const router = express.Router();

const profileController = require("../controllers/profileController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware.protect);

router.get('/get-user-info', profileController.getUserInfo);

module.exports = router;