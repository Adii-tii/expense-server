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
    groupController.update
);

router.get(
    "/user-groups",
    authMiddleware.protect,
    groupController.getGroupsByUser
);

router.get(
    "/:groupId/logs",
    authMiddleware.protect,
    groupController.getAuditLogs
);

module.exports = router;
