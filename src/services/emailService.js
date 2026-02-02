require('dotenv').config();

const nodemailer = require('nodemailer');

const emailClient = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GOOGLE_EMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD
    }
})
const emailService = {
    send: async(to, subject, body) => {
        const emailOptions = {
            from: process.env.GOOGLE_EMAIL,
            to: to,
            subject: subject,
            text: body,
            html: `<h1> Expense App </h1> <br/>
            <p> OTP to reset password: ${body}. <br/>
            This code will expire in 5 minutes. </p>`
        }

        await emailClient.sendMail(emailOptions);
    },
};

module.exports = emailService;