require('dotenv').config();

const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/user");
const { CREDIT_TO_PAISA_MAPPING } = require("../constants/paymentConstants")
const razorpayClient = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

const paymentsController = {
    //step 2: create order
    createOrder: async (req, res) => {
        try {
            const { credits } = req.body;

            if (!CREDIT_TO_PAISA_MAPPING[credits]) {
                return res.status(400).json({
                    message: "Invalid credit value"
                })
            }

            const amountInPaise = CREDIT_TO_PAISA_MAPPING[credits];

            const order = await razorpayClient.orders.create({
                amount: amountInPaise,
                currency: 'INR',
                receipt: `receipt_${Date.now()}`
            });

            console.log("order: ", order);

            return res.json({
                order:order
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "internal server error"
            })
        }
    },

    //step 9 (userflow diagram): verify transaction and update credits 
    verifyOrder: async (req, res) => {
        try{
            const{
                razorpay_order_id, razorpay_payment_id,
                razorpay_signature, credits
            } = req.body;

            const body = razorpay_order_id + '|' + razorpay_payment_id;

            const expectedSignature =  crypto //create unique digital fingerprint hmac of the secret key
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET) // feed both HMAC and body ito hashing function
            .update(body.toString()) //
            .digest('hex'); //convert the hashing string into hexadecimal format


            if(expectedSignature !== razorpay_signature){
                return res.status(400).json({
                    message: "Invalid Transaction"
                })
            }

            const user = await User.findById({_id: req.user.id});
            user.credits += Number(credits);
            await user.save();


            return res.status(200).json({
                user: user
            })
        }catch(error){
            return res.status(500).json({
                message: "internal server error"
            })
        }
    }
};

module.exports = paymentsController;