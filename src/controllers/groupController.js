const groupDao = require("../dao/groupDao");
const Group = require("../models/group");

const groupController = {
    create: async (req, res) => {
        const user = req.user;

        try {
            const { name, description, memberEmail, thumbnail } = req.body;

            let allMembers = [user.email];

            if (memberEmail && Array.isArray(memberEmail)) {
                allMembers = [...new Set([...allMembers, ...memberEmail])];
            }

            const newGroup = await groupDao.createGroup({
                name,
                description,
                adminEmail: user.email,
                memberEmail: allMembers,
                thumbnail,
                paymentStatus: {
                    amount: 0,
                    currency: 'INR',
                    date: Date.now(),
                    isPaid: false
                }
            });

            return res.status(201).json({
                message: "Group created successfully",
                group: newGroup
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "Internal server error"
            });
        }   
    },

    update: async(req, res) => {  
        try{
            const { groupId } = req.params;

            const{name, adminEmail, description, thumbnail} = req.body;
            const group = await Group.findById(groupId);

            if(!group){
                return res.status(404).json({
                    message: "group not found!"
                });
            }

            if(group.adminEmail != req.user.email){
                return res.status(403).json({
                    message: "Only admin can edit group details"
                })
            }

            const updatedData = {};

            if(name) updatedData.name = name;
            if(thumbnail) updatedData.thumbnail = thumbnail;
            if(adminEmail) updatedData.adminEmail = adminEmail;
            if(description) updatedData.description = description;

            const updatedGroup = await groupDao.updateGroup({
                groupId,
                ...updatedData
            })

            return res.status(200).json({
                message: "group details updated successfully",
                group: updatedGroup
            })
        } catch (error){
            console.log(error);
            return res.status(500).json({
                message: "internal server error!"
            })
        }
        
    },

    addMembers:  async(req, res) => {
        try{
            const {groupId, emails} = req.body;
            const updatedGroup = groupDao.addMembers(groupId,emails);

            return res.status(200).json({
                message: "Members added successfully",
                group: updatedGroup
            });
        } catch(error){
            console.log(error);
            return res.status(500).json({
                message: "Internal server error!"
            })
        }
    },

    removeMembers: async(req, res) => {
        const {groupId, emails} = req.body;

        try{
            const updatedGroup = await groupDao.removeMembers(groupId, emails);
            return res.status(200).json({
                message: "Members removed successfully",
                group: updatedGroup
            });
        }   catch (error){
            console.log(error);
            return res.status(500).json({
                message: "Internal server error!"
            })
        } 
    },  

    deleteGroup : async(req, res) => {
        try{
            console.log("code is here")
            const email = req.user.email;
            const {groupId} = req.params.groupId
            console.log(groupId);

            const group = await groupDao.getGroupById(groupId);
            
            if(!group){
                return res.status(400).json({
                    message: "Group not found in the database!"
                })
            }
            await groupDao.deleteGroup(_id);

            return res.status(200).json({
                message: "Removed group successfully"
            });

        } catch(error){
            return res.status(500).json({
                message: "Internal server error meh!"
            })
        }
    },

    getGroupsByUser: async(req, res) => {
        try{
            const email = req.user.email;
            console.log("this is the email", email);

            const groups = await groupDao.getGroupByEmail(email);

            if(groups.length == 0){
                return res.status(404).json({
                    message: "No groups exist for the given email"
                })
            }

            return res.status(200).json({
                message: "All groups fetched successfully!",
                groups
            })
            
        } catch (error){
            console.log(error);

            return res.status(500).json({
                message: "Internal Server Error!"
            })
        }
    },

    getAuditLogs: async (req, res) => {
    return res.status(200).json({
        logs: []
    });
}
};

module.exports = groupController;
