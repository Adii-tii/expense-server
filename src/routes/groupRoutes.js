const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupController");
const authMiddleware = require("../middlewares/authMiddleware");

console.log("GROUP ROUTES LOADED");

router.post(
    "/create",
    authMiddleware.protect,
    groupController.create
);

router.patch(
    "/:groupId",
    authMiddleware.protect,
    groupController.updateDetails
);

router.get(
    "/my",
    authMiddleware.protect,
    groupController.getMyGroups
);

router.get(
    "/:groupId/logs",
    authMiddleware.protect,
    groupController.getAuditLogs
);

module.exports = router;
