const express = require("express");
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');
const paymentsControllers = require('../controllers/paymentsController');
const paymentsController = require("../controllers/paymentsController");


router.post('/webhook', express.raw({type: 'application/json'}), paymentsControllers.handleWebhookEvents);
router.use(authMiddleware.protect);

router.post('/create-order',authorizeMiddleware('payment:create'), paymentsControllers.createOrder );
router.post('/verify-order',authorizeMiddleware('payment:create'), paymentsControllers.verifyOrder);
router.post('/create-subscription', authorizeMiddleware('payment:create'), paymentsController.createSubscription);
router.post('/capture-subscription', authorizeMiddleware('payment:create'), paymentsController.captureSubscription);

module.exports = router;

