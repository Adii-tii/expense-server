const Settlement = require("../models/settlement");

const settlementDao = {

  //creating settlement
  createSettlement: async (data) => {
    const settlement = new Settlement(data);
    return await settlement.save();
  },


  getSettlementById: async (settlementId) => {
    return await Settlement.findById(settlementId);
  },


  getSettlementsByGroupId: async (groupId) => {
    return await Settlement.find({ groupId })
      .sort({ createdAt: -1 });
  },


  getSettlementsByExpenseId: async (expenseId) => {
    return await Settlement.find({ expenseId })
      .sort({ createdAt: -1 });
  },


  getAllUserSettlements: async (email) => {

    return await Settlement
      .find({
        $or: [
          { "fromUser.email": email },
          { "toUser.email": email },
          { fromUserEmail: email },
          { toUserEmail: email }
        ]
      })
      .sort({ createdAt: -1 });

  },



  deleteSettlement: async (settlementId) => {
    return await Settlement.findByIdAndDelete(settlementId);
  }

};

module.exports = settlementDao;
