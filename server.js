require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require("cookie-parser");

const authRoutes = require('./src/routes/authRoutes');
const groupRoutes = require('./src/routes/groupRoutes');
const rbacRoutes = require('./src/routes/rbacRoutes');
const paymentsRoutes = require('./src/routes/paymentsRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const settlementRoutes  = require('./src/routes/settlementRoutes');

const app = express();

const PORT = 5001;

mongoose.connect(process.env.MONGO_DB_CONNECTION_URL)
    .then(() => console.log("connection established successfully!"))
    .catch(() => console.log("failed to establish connection"));

const corsOption = {
    origin: process.env.CLIENT_URL,
    credentials: true
};

app.use(cors(corsOption));

app.use((req, res, next) => {
    if(req.originalUrl.startsWith('/payments/webhook')){
        next();
    }
    express.json()(req,res,next);
})
app.use(cookieParser());

/* ================= ROUTES ================= */

app.use('/auth', authRoutes);
app.use('/groups', groupRoutes); 
app.use('/user', rbacRoutes);
app.use('/payments', paymentsRoutes);
app.use('/profile', profileRoutes);
app.use("/groups/:groupId/settlements", settlementRoutes);


app.post("/__routes_test", (req, res) => {
    res.send("Routes are working");
});

app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}/`);
});
