const { prototype } = require('events');
const express = require('express'); //legacy way of importing
const fs = require('fs');

const app = express(); // configuring express app
const PORT = 5001;

app.use(express.json()); //middleware to parse json body. It intercepts all incoming requests before the acutal code executes.
/*middleware is a function that runs between request and response cycle. used to 
1. authetication 
2. logging in 
3. parsing req body 
4. handling cors errors 
5. security headers*/

let users = [];
let id = 1;
app.post('/register', (req, res) => {
    const {name, email, password} = req.body;

    if(!name || !email || !password){
        return res.status(400).json({
            messages: 'Name, email and password are required!'
        })
    }
    else if(users.some(user => user.email === email)){ //Determines whether the specified callback function returns true for any element of an array.

        return res.status(400).json({
            message: 'User with this email already exists.'
        })
    } 

    const user = {
        name : name,
        email : email,
        password : password
    }
    
    users.push(user);
    console.log(user);
    res.status(200).json({
        "message" : "User registered",
        "user" : {
            "id" : id
        }
    })
    id++;
}) 
// execute the func only when the req is on /register
// in middlewares we dont define paths and let the function run for every incoming req.

app.post('/login', (req,res) => {
    const {email, password} = req.body;
    
    if(!email || !password){
        return res.status(400).json({
            message : "Email and password required to log in"
        })
    }
    else if(users.some(user => user.email === email && user.password === password)){
        return res.status(200).json({
            message: `successfuly logged in.`   
        })
    }
    
    return res.status(400).json({
        message : `user with email ${email} not found`
    })
})


app.listen(PORT, () => {
    console.log("server running on", PORT);
})