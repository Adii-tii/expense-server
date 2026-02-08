const express = require("express");

const expenseController = require("../controllers/expenseController");
const expense = require("../models/expense");

const router = express.Router({ mergeParams: true });

router.post("/create", expenseController.create);
router.get("/", expenseController.getExpensesByGroup);
router.patch("/:expenseId", expenseController.update);
module.exports  = router;
