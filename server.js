require('dotenv').config();

const express = require('express'); //legacy way of importing
const mongoose = require('mongoose');
const cookieParser = require("cookie-parser");
const authRoutes = require('./src/routes/authRoutes');
const groupRoutes = require('./src/routes/groupRoutes');


const app = express(); // configuring express app

const PORT = 5001;
mongoose.connect(process.env.MONGO_DB_CONNECTION_URL)
    .then(() => console.log("connection established successfully!"))
    .catch((error) => console.log("failed to establish connection"));

app.use(express.json()); 
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/group', groupRoutes);

app.post("/__routes_test", (req, res) => {
    res.send("Routes are working");
});

app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}/`)
})