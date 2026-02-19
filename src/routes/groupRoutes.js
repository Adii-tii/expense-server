const express = require("express");
const router = express.Router({ mergeParams: true });

const groupController = require("../controllers/groupController");
const expenseController = require("../controllers/expenseController");

const authMiddleware = require("../middlewares/authMiddleware");
const authorizeMiddleware = require("../middlewares/authorizeMiddleware");

const expenseRoutes = require("./expenseRoutes");
const settlementRoutes = require("./settlementRoutes");

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });


console.log("GROUP ROUTES LOADED");

/* ================= GROUP MANAGEMENT ================= */

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

router.patch(
    "/:groupId/add-members",
    authMiddleware.protect,
    authorizeMiddleware('group:update'),
    groupController.addMembers
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
);

/* ================= BALANCE SUMMARY ================= */

router.get(
    "/:groupId/total-owed",
    authMiddleware.protect,
    expenseController.getTotalOwedByUserInGroup
);

router.get(
    "/:groupId/total-is-owed",
    authMiddleware.protect,
    expenseController.getTotalUserIsOwedInGroup
);

router.get(
    "/:groupId/people-i-owe",
    authMiddleware.protect,
    expenseController.getPeopleIOwe
);

router.post(
    "/:groupId/thumbnail",
    authMiddleware.protect,
    upload.single("image"),
    groupController.uploadGroupThumbnail
);


// router.get(
//     "/:groupId/people-who-owe-me",
//     authMiddleware.protect,
//     expenseController.getPeopleWhoOweMe
// );

/* ================= NESTED ROUTES ================= */

router.use(
    "/:groupId/expenses",
    authMiddleware.protect,
    expenseRoutes
);

router.use(
    "/:groupId/settlements",
    authMiddleware.protect,
    settlementRoutes
);

module.exports = router;
