const expenseDao = require("../dao/expenseDao");
const groupDao = require("../dao/groupDao");
const Group = require("../models/group");

const expenseController = {

    /* ================= CREATE EXPENSE ================= */

    create: async (req, res) => {
        try {

            const { groupId } = req.params;

            const {
                title,
                currency,
                amount,
                splits,
                paidBy,
                splitType,
                notes
            } = req.body;

            if (!title || !amount || !splits || !paidBy) {
                return res.status(400).json({
                    message: "Missing required fields"
                });
            }

            const group = await Group.findById(groupId);
            if (!group) {
                return res.status(404).json({
                    message: "Group not found"
                });
            }

            const paidTotal = paidBy.reduce((sum, p) => sum + p.amount, 0);
            const splitTotal = splits.reduce((sum, s) => sum + s.share, 0);

            if (paidTotal !== amount || splitTotal !== amount) {
                return res.status(400).json({
                    message: "Paid and split totals must equal expense amount"
                });
            }

            const paidMap = {};
            paidBy.forEach(p => {
                paidMap[p.email] = (paidMap[p.email] || 0) + p.amount;
            });

            const preparedSplits = splits.map(s => ({
                ...s,
                remaining: s.share - (paidMap[s.email] || 0)
            }));

            const expense = await expenseDao.createExpense({
                groupId,
                title,
                currency: currency || "INR",
                amount,
                splits: preparedSplits,
                paidBy,
                splitType,
                notes
            });

            /* ===== UPDATE GROUP BALANCES ===== */

            preparedSplits.forEach(split => {
                const entry = group.balances.find(b => b.userEmail === split.email);
                if (entry) entry.netBalance -= split.share;
            });

            paidBy.forEach(payer => {
                const entry = group.balances.find(b => b.userEmail === payer.email);
                if (entry) entry.netBalance += payer.amount;
            });

            await group.save();

            return res.status(201).json({
                expense,
                message: "Expense created successfully"
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "Internal Server Error"
            });
        }
    },

    /* ================= UPDATE EXPENSE ================= */

    update: async (req, res) => {
        try {
            const { expenseId } = req.params;

            const existing = await expenseDao.getExpenseById(expenseId);
            if (!existing) {
                return res.status(404).json({ message: "Expense not found" });
            }

            return res.status(400).json({
                message: "Editing expenses after settlements is restricted. Create a correction expense instead."
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "Internal server error"
            });
        }
    },

    /* ================= GET EXPENSES ================= */

    getExpensesByGroup: async (req, res) => {
        try {

            const { groupId } = req.params;
            const { email } = req.user;

            const group = await Group.findById(groupId);

            if (!group) {
                return res.status(404).json({
                    message: "Group does not exist"
                });
            }

            const expenses = await expenseDao.getExpensesByGroupId(groupId);

            const myBalance = group.balances.find(b => b.userEmail === email);

            return res.status(200).json({
                expenses,
                netBalance: myBalance ? myBalance.netBalance : 0
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "Internal server error"
            });
        }
    },

    /* ================= DELETE EXPENSE ================= */

    delete: async (req, res) => {
        try {

            const { expenseId } = req.params;

            const expense = await expenseDao.getExpenseById(expenseId);
            if (!expense) {
                return res.status(404).json({
                    message: "Expense does not exist"
                });
            }

            const group = await Group.findById(expense.groupId);

            /* ===== ROLLBACK BALANCES ===== */

            expense.splits.forEach(split => {
                const entry = group.balances.find(b => b.userEmail === split.email);
                if (entry) entry.netBalance += split.share;
            });

            expense.paidBy.forEach(payer => {
                const entry = group.balances.find(b => b.userEmail === payer.email);
                if (entry) entry.netBalance -= payer.amount;
            });

            await group.save();
            await expenseDao.deleteExpense(expenseId);

            return res.status(200).json({
                message: "Expense deleted"
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "Internal server error"
            });
        }
    },

    /* ================= TOTAL I OWE ================= */

    getTotalOwedByUserInGroup: async (req, res) => {
        try {
            const { email } = req.user;
            const { groupId } = req.params;

            const group = await Group.findById(groupId);

            const myBalance = group.balances.find(b => b.userEmail === email);

            const totalOwed = myBalance && myBalance.netBalance < 0
                ? Math.abs(myBalance.netBalance)
                : 0;

            return res.status(200).json({ totalOwed });

        } catch (error) {
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    /* ================= TOTAL I AM OWED ================= */

    getTotalUserIsOwedInGroup: async (req, res) => {
        try {
            const { email } = req.user;
            const { groupId } = req.params;

            const group = await Group.findById(groupId);

            const myBalance = group.balances.find(b => b.userEmail === email);

            const totalIsOwed = myBalance && myBalance.netBalance > 0
                ? myBalance.netBalance
                : 0;

            return res.status(200).json({ totalIsOwed });

        } catch (error) {
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    /* ================= PEOPLE I OWE ================= */

    getPeopleIOwe: async (req, res) => {
        try {

            const { groupId } = req.params;
            const { email } = req.user;

            const group = await Group.findById(groupId);

            const myBalance = group.balances.find(b => b.userEmail === email);

            if (!myBalance || myBalance.netBalance >= 0) {
                return res.status(200).json({ creditors: [] });
            }

            let remainingDebt = Math.abs(myBalance.netBalance);

            const creditors = group.balances
                .filter(b => b.netBalance > 0)
                .map(b => {
                    const amount = Math.min(remainingDebt, b.netBalance);
                    remainingDebt -= amount;
                    return { email: b.userEmail, amount };
                })
                .filter(c => c.amount > 0);

            return res.status(200).json({ creditors });

        } catch (error) {
            return res.status(500).json({ message: "Internal server error" });
        }
    }

};

module.exports = expenseController;
