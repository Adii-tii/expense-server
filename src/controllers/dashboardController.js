const expenseDao = require("../dao/expenseDao");
const Group = require("../models/group");

const dashboardController = {

  getUserSummary: async (req, res) => {
    try {

      const userEmail = req.user.email;

      /* ===== FETCH ALL EXPENSES WHERE USER IS INVOLVED ===== */

      const expenses =
        await expenseDao.getExpensesByUserParticipation(userEmail);

      let totalOwe = 0;
      let totalOwed = 0;
      let monthlyTotal = 0;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      expenses.forEach(expense => {

        const mySplit =
          expense.splits?.find(s => s.email === userEmail);

        const myPaid =
          expense.paidBy?.find(p => p.email === userEmail)?.amount || 0;

        if (!mySplit) return;

        const myShare = mySplit.share;
        const myRemaining = mySplit.remaining ?? myShare;

        /* ===== OWE ===== */
        if (myRemaining > 0)
          totalOwe += myRemaining;

        /* ===== OWED ===== */
        if (myPaid > myShare)
          totalOwed += (myPaid - myShare);

        /* ===== MONTHLY ===== */
        const createdDate = new Date(expense.createdAt);

        if (
          createdDate.getMonth() === currentMonth &&
          createdDate.getFullYear() === currentYear
        ) {
          if (mySplit)
            monthlyTotal += myShare;
        }

      });

      const totalBalance = totalOwed - totalOwe;

      return res.status(200).json({
        totalBalance,
        totalOwe,
        totalOwed,
        monthlyTotal
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to fetch dashboard summary"
      });
    }
  }

};

module.exports = dashboardController;
