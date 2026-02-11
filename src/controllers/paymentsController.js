const Razorpay = require("razorpay");
const PLAN_IDS = require("../constants/paymentConstants");
const crypto = require("crypto");
const User = require("../models/user");
const { CREDIT_TO_PAISA_MAPPING } = require("../constants/paymentConstants");

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
                order: order
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
        try {
            const {
                razorpay_order_id, razorpay_payment_id,
                razorpay_signature, credits
            } = req.body;

            const body = razorpay_order_id + '|' + razorpay_payment_id;

            const expectedSignature = crypto //create unique digital fingerprint hmac of the secret key
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET) // feed both HMAC and body ito hashing function
                .update(body.toString()) //
                .digest('hex'); //convert the hashing string into hexadecimal format


            if (expectedSignature !== razorpay_signature) {
                return res.status(400).json({
                    message: "Invalid Transaction"
                })
            }

            const user = await User.findById({ _id: req.user.id });
            user.credits += Number(credits);
            await user.save();


            return res.status(200).json({
                user: user
            })
        } catch (error) {
            return res.status(500).json({
                message: "internal server error"
            })
        }
    },

    createSubscription: async (req, res) => {
        try {
            const { plan_name } = req.body;

            if (!PLAN_IDS[plan_name]) {
                return res.status(400).json({
                    message: "Invalid plan selected"
                })
            }

            const plan = PLAN_IDS[plan_name];

            const subscription = await razorpayClient.subscriptions.create({
                plan_id: plan.id,
                customer_notify: 1,
                total_count: plan.totalBillingCycleCount,
                notes: {
                    userId: req.user._id //razorpay will send these values as they are when it updates the server about events like created, activated, cancelled
                }
            })

            return res.json({
                subscription: subscription
            })

        } catch (error) {
            console.log(error);

            return res.status(500).json({
                message: "Internal server error"
            })
        }
    },

    captureSubscription: async (req, res) => {
        try {
            const { subscriptionId } = req.body;

            const subscription = await razorpayClient.subscriptions.fetch(subscriptionId);
            const user = await User.findById({ _id: req.user._id });

            //this obj will help us know on the UI whether its ok for the user to initiate another subs. or one is already in progress. we dont want user to initiate multiple subs at a time.

            user.subscription = {
                subscriptionId: subscriptionId,
                planId: planId,
                status: subscription.status
            }

            await user.save();
            res.json({
                user: user
            })


        } catch (error) {
            console.log(error);

            return res.status(500).json({
                message: "Internal server error"
            })
        }
    },

    handleWebhookEvents: async (req, res) => { // cant let this req hit the endpoint through the middleware. we need the req as it is without any change in order to verify the signature
        try {
            console.log('Received Event');
            const signature = req.header('x-razorpay-signature');

            const body = req.body;

            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
                .update(body)
                .digest('hex');

            if (expectedSignature !== signature) {
                return res.status(400).send('invalid signature');
            }

            const payload = JSON.parse(body);
            console.log(JSON.stringify(payload, null, 2));

            const event = payload.event;
            const subscriptionData = payload.payload.subscription.entry;
            const razorpaySubscriptionId = subscriptionData.id;
            const userId = subscriptionData.notes?.userId;

            if (!userId) {
                console.log("UserId not found in the notes");
                return res.status(400).send("UserId not found in the notes");
            }

            let newStatus;
            switch (event) {
                case "subscription.activated":
                    newStatus = 'active'
                    break;
                case "subscription.pending":
                    newStatus = 'pending'
                    break;
                case "subscription.cancelled":
                    newStatus = 'cancelled'
                    break;
                case "subscription.completed":
                    newStatus = 'completed'
                    break;
            }

            if (!newStatus) {
                console.log();
                return res.status(200).send('Unhandled event received: ', event);

            }

            await User.findByIdAndUpdate(
                { _id: userId },
                {
                    $set: {
                        'subscription.subscriptionId': razorpaySubscriptionId,
                        'subscription.status' : newStatus,
                        'subscription.planId' : subscriptionData.plan_id,
                        'subscription.start' : subscriptionData.start_at ? 
                        new Date(subscriptionData.start_at  * 1000) : null,
                        'subscription.end' : subscriptionData.end_at ? 
                        new Date(subscriptionData.end_at * 1000) : null,
                        'subscription.lastBillDate' : subscriptionData.current_start?
                         newDate(subscriptionData.current_start * 1000) : null,
                        'subscription.paymentsMade' : subscriptionData.paid_count,
                        'subscription.paymentsRemaining' : subscriptionData.remaining_count

                    }
                }, {new: true}
            )

            if(!user){
                console.log('No user with provided userID exist');
                return res.status(400).send('No user with provided userID exists');
            }

            console.log('Updated subscription status for the user' , user, " to ", newStatus);
            return res.status(200).send(`Event processed for user: ${user.email} with userId: ${userId}`)

        } catch (error) {
            console.log(error);

            return res.status(500).json({
                message: "Internal server error"
            })
        }
    }
};

module.exports = paymentsController;