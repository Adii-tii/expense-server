require('dotenv').config();

const express = require('express'); //legacy way of importing
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const authRoutes = require('./src/routes/authRoutes');
const groupRoutes = require('./src/routes/groupRoutes');
const rbacRoutes = require('./src/routes/rbacRoutes');
const expenseRoutes = require('./src/routes/expenseRoutes');
const paymentsRoutes = require('./src/routes/paymentsRoutes');
const profileRoutes = require('./src/routes/profileRoutes');


const app = express(); // configuring express app

const PORT = 5001;
mongoose.connect(process.env.MONGO_DB_CONNECTION_URL)
    .then(() => console.log("connection established successfully!"))
    .catch((error) => console.log("failed to establish connection"));


const corsOption = {
    origin: process.env.CLIENT_URL,
    credentials: true
}

app.use(cors(corsOption));
app.use(express.json()); 
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/group', groupRoutes);
app.use('/user', rbacRoutes);
app.use('/group/:groupId/expenses', expenseRoutes); //for expense route
app.use('/payments', paymentsRoutes);
app.use('/profile', profileRoutes);

app.post("/__routes_test", (req, res) => {
    res.send("Routes are working");
});

app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}/`)
})