const express = require("express");
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');
const paymentsControllers = require('../controllers/paymentsController');

router.use(authMiddleware.protect);

router.post('/create-order',authorizeMiddleware('payment:create'), paymentsControllers.createOrder );
router.post('/verify-order',authorizeMiddleware('payment:create'), paymentsControllers.verifyOrder);

module.exports = router;

