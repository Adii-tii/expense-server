require('dotenv').config();

const express = require('express'); //legacy way of importing
const mongoose = require('mongoose');

const app = express(); // configuring express app

const PORT = 5001;
mongoose.connect(process.env.MONGO_DB_CONNECTION_URL)
    .then(() => console.log("connection established successfully!"))
    .catch((error) => console.log("failed to establish connection"));

app.use(express.json()); 

const authRoutes = require('./src/routes/authRoutes');
app.use('/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}/`)
})