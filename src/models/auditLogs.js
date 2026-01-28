const mongoose = require("mongoose");

const auditLogs = {
    groupId: {
        type:mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },
    action: {
        type:String,
        required: true
    },

    performedBy: {
        type:String,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }


}