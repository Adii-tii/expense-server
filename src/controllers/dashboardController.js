const expenseDao = require("../dao/expenseDao");
const groupDao = require("../dao/groupDao");
const expense = require("../models/expense");
const Group = require("../models/group");

const dashboardController = {

  getUserSummary: async (req, res) => {
    try {
      const userEmail = req.user.email;

      const userGroups = await groupDao.getGroupByEmail(userEmail);

      let totalOwe = 0;
      let totalOwed = 0;
      let totalSpendings = await expenseDao.getTotalUserSpendings(userEmail);

      const groupSummaries = await Promise.all(
        userGroups.map(async (userGroup) => {

          const [toPay, toReceive, spendings] = await Promise.all([
            expenseDao.getTotalOwedByUserInGroup(userEmail, userGroup),
            expenseDao.getTotalUserIsOwedInGroup(userEmail, userGroup),
          ]);

          return { toPay, toReceive, spendings };
        })
      );

      for (const g of groupSummaries) {
        totalOwe += g.toPay || 0;
        totalOwed += g.toReceive || 0;
      }

      const totalBalance = totalOwed - totalOwe;

      return res.status(200).json({
        totalBalance,
        totalOwe,
        totalOwed,
        totalSpendings
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to fetch dashboard summary"
      });
    }
  },

  getDashboardDebts: async (req, res) => {
    try {

      const { email: myEmail } = req.user;

      /* -------- FIND USER GROUPS -------- */

      const groups = await Group.find({
        memberEmail: myEmail
      });

      const groupIds = groups.map(g => g._id);

      /* -------- FETCH UNSETTLED EXPENSES -------- */

      const expenses = await expenseDao
        .getUnsettledExpensesForGroups(groupIds);

      const debtMap = {};
      /*
        Structure:
        {
          "groupId-creditorEmail": {
              groupId,
              groupName,
              to,
              amount
          }
        }
      */

      expenses.forEach(expense => {

        const totalAmount = expense.amount;
        const payers = expense.paidBy;
        const splits = expense.splits;

        const mySplit = splits.find(s => s.email === myEmail);

        if (!mySplit || mySplit.remaining <= 0) return;

        payers.forEach(payer => {

          if (payer.email === myEmail) return;

          const share =
            mySplit.remaining * (payer.amount / totalAmount);

          const key = `${expense.groupId}-${payer.email}`;

          if (!debtMap[key]) {
            const group = groups.find(
              g => g._id.toString() === expense.groupId.toString()
            );

            debtMap[key] = {
              groupId: expense.groupId,
              groupName: group?.name || "Group",
              to: payer.email,
              amount: 0
            };
          }

          debtMap[key].amount += share;
        });

      });

      const result = Object.values(debtMap)
        .map(entry => ({
          ...entry,
          amount: Number(entry.amount.toFixed(2))
        }))
        .filter(entry => entry.amount > 0);

      return res.status(200).json({
        success: true,
        debts: result
      });

    } catch (error) {

      console.error("Dashboard Debts Error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }


};

module.exports = dashboardController;
