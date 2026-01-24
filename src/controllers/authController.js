const users = require("../dao/userDb");

//because passwords are sensitive information we wont send them as params. sensitive info majorly travels as body of the req
const authController = {
    register : (req,res) => {
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
            "id" : users.length + 1
        }
    })
    },

    login: (req,res) => {
        const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password required to log in"
        });
    }

    const user = users.find(user => user.email === email);

    if (!user) {
        return res.status(400).json({
            message: `User with email ${email} not found`
        });
    }

    if (user.password !== password) {
        return res.status(400).json({
            message: "Incorrect password"
        });
    }

    return res.status(200).json({
        message: "Successfully logged in"
    });
    }
}

module.exports = authController;