const settlementDao = require("../dao/settlementDao");
const expenseDao = require("../dao/expenseDao");
const Group = require("../models/group");



const settlementController = {

  /* ================= CREATE SETTLEMENT ================= */

  create: async (req, res) => {
    try {

      const { groupId } = req.params;

      const {
        fromUserEmail,
        toUserEmail,
        amount,
        expenseId,
        currency,
        note
      } = req.body;

      if (!fromUserEmail || !toUserEmail || !amount || amount <= 0) {
        return res.status(400).json({
          message: "Invalid or missing required fields"
        });
      }

      const group = await Group.findById(groupId);

      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }

      /* ================= EXPENSE LEVEL SETTLEMENT ================= */

      if (expenseId) {

        const expense = await expenseDao.getExpenseById(expenseId);

        if (!expense) {
          return res.status(404).json({ message: "Expense not found" });
        }

        const splitEntry = expense.splits.find(
          s => s.email === fromUserEmail
        );

        if (!splitEntry) {
          return res.status(400).json({
            message: "User not part of expense"
          });
        }

        if (splitEntry.remaining < amount) {
          return res.status(400).json({
            message: "Settlement exceeds remaining amount"
          });
        }

        /* ===== Update Expense Remaining ===== */

        const newRemaining =
          Math.round((splitEntry.remaining - amount) * 100) / 100;

        await expenseDao.updateSplitRemaining(
          expenseId,
          fromUserEmail,
          newRemaining
        );

        /* ===== Update Group Balances ===== */

        const fromBalance = group.balances.find(
          b => b.userEmail === fromUserEmail
        );

        const toBalance = group.balances.find(
          b => b.userEmail === toUserEmail
        );

        fromBalance.netBalance += amount;
        toBalance.netBalance -= amount;

        await group.save();

      }

      /* ================= GROUP LEVEL SETTLEMENT ================= */

      else {

        const fromBalance = group.balances.find(
          b => b.userEmail === fromUserEmail
        );

        const toBalance = group.balances.find(
          b => b.userEmail === toUserEmail
        );

        if (!fromBalance || !toBalance) {
          return res.status(400).json({
            message: "Users not part of group"
          });
        }

        if (Math.abs(fromBalance.netBalance) < amount) {
          return res.status(400).json({
            message: "Settlement exceeds user debt"
          });
        }

        //updating netbalances only. 
        fromBalance.netBalance += amount;
        toBalance.netBalance -= amount;

        await group.save();
      }

      /* ================= STORE SETTLEMENT ================= */

      const settlement = await settlementDao.createSettlement({
        groupId,
        fromUserEmail,
        toUserEmail,
        amount,
        currency: currency || "INR",
        expenseId: expenseId || null,
        type: expenseId ? "expense-settlement" : "group-settlement",
        note
      });

      return res.status(201).json({
        settlement,
        message: "Settlement recorded successfully"
      });

    } catch (error) {
      console.error("Settlement Error:", error);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  /* ================= GET BY GROUP ================= */

  getByGroup: async (req, res) => {
    try {
      const { groupId } = req.params;

      const settlements =
        await settlementDao.getSettlementsByGroupId(groupId);

      return res.status(200).json({ settlements });

    } catch (error) {
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  /* ================= GET BY EXPENSE ================= */

  getByExpense: async (req, res) => {
    try {
      const { expenseId } = req.params;

      const settlements =
        await settlementDao.getSettlementsByExpenseId(expenseId);

      return res.status(200).json({ settlements });

    } catch (error) {
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  /* ================= GET BY USER ================= */

  getAllUserSettlements: async (req, res) => {
    try {
      console.log(req.user);
      const { email } = req.user;

      const settlements =
        await settlementDao.getAllUserSettlements(email);

      return res.status(200).json({ settlements });

    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },


  /* ================= DELETE SETTLEMENT ================= */

  delete: async (req, res) => {
    try {
      const { settlementId } = req.params;

      const settlement =
        await settlementDao.getSettlementById(settlementId);

      if (!settlement) {
        return res.status(404).json({
          message: "Settlement not found"
        });
      }

      return res.status(400).json({
        message:
          "Deleting settlements is not allowed. Use reversal instead."
      });

    } catch (error) {
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  }

};

module.exports = settlementController;
