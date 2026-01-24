const express = require('express'); //legacy way of importing
const app = express(); // configuring express app

const PORT = 5001;
app.use(express.json()); 

const authRoutes = require('./src/routes/authRoutes');
app.use('/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}/`)
})