const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');

console.log("GROUP ROUTES LOADED");

router.post(
    "/create",
    authMiddleware.protect,
    authorizeMiddleware('group:create'),
    groupController.create
);

router.patch(
    "/:groupId",
    authMiddleware.protect,
    authorizeMiddleware('group:update'),
    groupController.update
);

router.get(
    "/my-groups",
    authMiddleware.protect,
    authorizeMiddleware('group:view'),
    groupController.getGroupsByUser
);

router.get(
    "/:groupId/logs",
    authMiddleware.protect,
    authorizeMiddleware('group:view'),
    groupController.getAuditLogs
);

router.delete(
    "/:groupId/delete",
    authMiddleware.protect,
    authorizeMiddleware('group:delete'),
    groupController.deleteGroup
)

module.exports = router;
