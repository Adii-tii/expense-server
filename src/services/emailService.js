const nodemailer = require('nodemailer');

const emailClient = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GOOGLE_EMAIL,
        password: process.env.GOOGLE_APP_PASSWORD
    }
})
const emailService = {
    send: async(to, subject, body) => {
        const emaailOptions = {
            from: process.env.GOOGLE_EMAIL,
            to: to,
            subject: subject,
            text: body
        }

        await emailClient.sendMail(emaailOptions);
    },
};

module.exports = emailService;