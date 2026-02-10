const expenseDao = require("../dao/expenseDao");
const groupDao = require("../dao/groupDao");

const expenseController = {

    create: async (req, res) => {
        try {
            const { groupId } = req.params;

            const {
                title,
                currency,
                amount,
                members,
                paidBy,
                splitType,
            } = req.body;

            if(!title || !amount || !paidBy || !splitType || !groupId){
                return res.status(400).json({
                    message: "Missing required fields"
                });
            }

            const expense = await expenseDao.createExpense({
                groupId,
                title,
                currency: currency || "INR",
                amount,
                members,
                paidBy,
                splitType,
                status: "pending",
                createdAt: new Date()
            });

            return res.status(201).json({
                expense,
                message:"Expense created successfully"
            });

        } catch (error){
            console.log(error);
            return res.status(500).json({
                message: "Internal Server Error"
            });
        }
    },

    update: async(req, res) => {
        try{
            const {expenseId} = req.params;

            

        }catch(error){
            console.log(error);
            return res.status(500).json({
                message: "Internal server error"
            })
        }
    },

    getExpensesByGroup: async(req, res) => {
        try{
            const { groupId } = req.params;

            const groupExists = await groupDao.getGroupById(groupId);

            if(!groupExists) {
                return res.status(404).json({
                    message: "Group does not exist"
                });
            }

            const expenses = await expenseDao.getExpensesByGroupId(groupId);

            if(expenses.length === 0){
                return res.status(200).json({
                    expenses: [],
                    message: "No expenses added yet"
                });
            }

            return res.status(200).json({
                expenses,
                message: "Expenses fetched successfully"
            });

        } catch (error){
            console.log(error);

            return res.status(500).json({
                message: "Internal server error"
            });
        }
    },

    



};

module.exports = expenseController;
