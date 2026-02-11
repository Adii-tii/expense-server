const Expense = require("../models/expense");
const mongoose = require("mongoose");

const expenseDao = {

    /* ================= CREATE ================= */

    createExpense: async (expenseData) => {
        const newExpense = new Expense(expenseData);
        return await newExpense.save();
    },

    /* ================= UPDATE EXPENSE ================= */

    updateExpense: async (expenseId, updateData) => {
        return await Expense.findByIdAndUpdate(
            expenseId,
            updateData,
            { new: true }
        );
    },

    /* ================= GET BY ID ================= */

    getExpenseById: async (expenseId) => {
        return await Expense.findById(expenseId);
    },

    /* ================= UPDATE SPLITS ================= */
    // Used when settlements happen

    updateSplitRemaining: async (expenseId, email, newRemaining) => {

        return await Expense.findOneAndUpdate(
            {
                _id: expenseId,
                "splits.email": email
            },
            {
                $set: {
                    "splits.$.remaining": newRemaining
                }
            },
            { new: true }
        );
    },

    /* ================= MARK EXPENSE SETTLED ================= */

    markExpenseSettled: async (expenseId) => {
        return await Expense.findByIdAndUpdate(
            expenseId,
            { isSettled: true },
            { new: true }
        );
    },

    /* ================= DELETE ================= */
    // (soft delete recommended later)

    deleteExpense: async (expenseId) => {
        return await Expense.findByIdAndDelete(expenseId);
    },

    /* ================= QUERY ================= */

    getExpensesByGroupId: async (groupId) => {
        return await Expense.find({ groupId });
    },

    getExpensesBySettlementStatus: async (groupId, isSettled) => {
        return await Expense.find({
            groupId,
            isSettled
        });
    },

    getExpensesByUserParticipation: async (email) => {
        return await Expense.find({
            "splits.email": email
        });
    },


    getExpensesPaidByUser: async (userId) => {
        return await Expense.find({
            "paidBy.userId": userId
        });
    },

    getUnsettledDebtsBetweenUsers: async (groupId, fromEmail, toEmail) => {
        try {
            // Use $elemMatch to ensure the specific user has a remaining balance > 0
            const toReturn = await Expense.find({
                groupId: groupId,
                "paidBy.email": toEmail, // The creditor
                isSettled: false,
                splits: {
                    $elemMatch: {
                        email: fromEmail,      // The debtor
                        remaining: { $gt: 0 }  // Must have debt in THIS specific split
                    }
                }
            }).sort({ createdAt: 1 }); // FIFO: Settle oldest debts first

            return toReturn;
        } catch (error) {
            console.error("Error in getUnsettledDebtsBetweenUsers:", error);
            throw error;
        }
    },

    getTotalOwedBetweenUsers: async (groupId, fromEmail, toEmail) => {

        const expenses = await Expense.find({
            groupId,
            isSettled: false,
            "splits.email": fromEmail,
            "paidBy.email": toEmail
        });

        let totalDebt = 0;

        for (const exp of expenses) {

            const fromSplit = exp.splits.find(
                s => s.email === fromEmail
            );

            if (!fromSplit || fromSplit.remaining <= 0) continue;

            const toPaid = exp.paidBy.find(
                p => p.email === toEmail
            );

            if (!toPaid) continue;

            const totalPaid = exp.paidBy.reduce(
                (sum, p) => sum + p.amount,
                0
            );

            if (totalPaid === 0) continue;

            const ratio = toPaid.amount / totalPaid;

            totalDebt += fromSplit.remaining * ratio;
        }

        return totalDebt;
    },


    /* Inside expenseDao.js */

    // 1. How much do I owe others?
    getTotalOwedByUser: async (groupId, email) => {
        const result = await Expense.aggregate([
            {
                $match: {
                    groupId: new mongoose.Types.ObjectId(groupId),
                    isSettled: false,
                    "splits.email": email
                }
            },
            { $unwind: "$splits" },
            { $match: { "splits.email": email } },
            { $group: { _id: null, total: { $sum: "$splits.remaining" } } }
        ]);
        return result[0]?.total || 0;
    },

    // 2. How much do others owe me?
    getTotalUserIsOwed: async (groupId, email) => {

        const expenses = await Expense.find({
            groupId,
            isSettled: false,
            $or: [
                { "paidBy.email": email },
                { "splits.email": email }
            ]
        });

        let total = 0;

        for (const exp of expenses) {

            const myPaid = exp.paidBy
                .filter(p => p.email === email)
                .reduce((sum, p) => sum + p.amount, 0);

            const myShare = exp.splits
                .filter(s => s.email === email)
                .reduce((sum, s) => sum + s.share, 0);

            const net = myPaid - myShare;

            if (net > 0) total += net;
        }

        return total;
    },

    getUserDebtsInGroup: async (req, res) => {
        try {
            const { groupId } = req.params;
            const { email: myEmail } = req.user; // Logged-in user

            // 1. Fetch all unsettled expenses in the group
            const expenses = await expenseDao.getUnsettledExpensesByGroup(groupId);

            // 2. Map to track net balances specifically for the user
            // { "creditorEmail": netAmount }
            const myDebts = {};

            expenses.forEach((expense) => {
                const totalAmount = expense.amount;
                const payers = expense.paidBy; // Array: [{email, amount}]
                const splits = expense.splits; // Array: [{email, remaining}]

                const mySplit = splits.find(s => s.email === myEmail);
                if (mySplit && mySplit.remaining > 0) {
                    payers.forEach((payer) => {
                        if (payer.email === myEmail) return; // Can't owe myself

                        // Calculation: My Remaining Debt * (Payer's Share / Total Bill)
                        const shareOwedToPayer = mySplit.remaining * (payer.amount / totalAmount);

                        myDebts[payer.email] = (myDebts[payer.email] || 0) + shareOwedToPayer;
                    });
                }

            });

            const finalPairs = Object.entries(myDebts)
                .map(([creditorEmail, amount]) => ({
                    to: creditorEmail,
                    amount: Number(amount.toFixed(2))
                }))
                .filter(pair => pair.amount > 0); 

            return res.status(200).json({
                myDebts: finalPairs
            });

        } catch (error) {
            console.error("Error in getUserDebtsInGroup:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

};

module.exports = expenseDao;

