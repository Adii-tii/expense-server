const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middlewares/authMiddleware");
const expenseController = require("../controllers/expenseController");

router.get(
  "/summary",
  authMiddleware.protect,
  dashboardController.getUserSummary
);

router.get(
    "/grouped-by-category", authMiddleware.protect,
    expenseController.getExpensesGroupedByCategory
);  

router.get(
  "/quick-settle",
  authMiddleware.protect,
  dashboardController.getDashboardDebts
);

router.get(
  "/recent-activities",
  authMiddleware.protect,
  dashboardController.getRecentActivities
);

module.exports = router;
