const express = require('express'); //legacy way of importing
const fs = require('fs');

const app = express(); // configuring express app

app.use(express.json()); //middleware to parse json body. It intercepts all incoming requests before the acutal code executes.
/*middleware is a function that runs between request and response cycle. used to 
1. authetication 
2. logging in 
3. parsing req body 
4. handling cors errors 
5. security headers*/

app.post('/register', (req, res) => {
    const {name, email, password} = req.body;

    if(!name || !email || !password){
        return res.status(400).json({
            messages: 'Name, email and password are required!'
        })
    }

    fs.appendFileSync("users.txt", `${name} ${email} ${password}\n`);
    res.status(200);
    res.send("registered successfully");
    console.log(`${name} has registered.`);
}) 
// execute the func only when the req is on /register
// in middlewares we dont define paths and let the function run for every incoming req.


app.listen(4000, () => {
    console.log("server running on 4000");
})