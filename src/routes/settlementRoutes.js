const express = require("express");
const router = express.Router({ mergeParams: true });

const settlementController = require("../controllers/settlementController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware.protect);


router.post("/", settlementController.create);
router.get("/", settlementController.getByGroup);
router.get("/expense/:expenseId", settlementController.getByExpense);
router.get(
    "/user/",
    settlementController.getAllUserSettlements
);


module.exports = router;
