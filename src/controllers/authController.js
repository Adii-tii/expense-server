const userDao = require("../dao/userDao");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")

//because passwords are sensitive information we wont send them as params. sensitive info majorly travels as body of the req
const authController = {
    register : async(req,res) => {
        const {name, email, password} = req.body;

    if(!name || !email || !password){
        return res.status(400).json({
            messages: 'Name, email and password are required!'
        })
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await userDao.create({
        name : name,
        email : email,
        password : hashedPassword
    }).then(u => {
        console.log(u);
        return res.status(200).json({
            message: "successfuly registered!",
            id : u._id
        });   
    })
    .catch((error)=> {
        if(error.code === 'USER_EXISTS'){
            return res.status(400).json({
                message: "User with this email already exists! Try loggin in."
            })
        }else{
            return res.status(500).json({
                message: "internal server error!"
            })
        }
    })
    },

    login: async (req,res) => {
        const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password required to log in"
        });
    }

    const user = await userDao.findByEmail(email);
    if (!user) {
        return res.status(400).json({
            message: `User with email ${email} not found`
        });
    }


    if (!bcrypt.compare(password, user.password)) {
        return res.status(400).json({
            message: "Incorrect password"
        });
    }

    const token = jwt.sign({ //creating a token using .sign() method
        name: user.name,
        email: user.email,
        id: user._id
    }, process.env.JWT_SECRET, {
        expiresIn: '1h'
    })

    res.cookie('jwtToken', token, { //attaching the jwt token to the response cookies
        httpOnly: true, 
        secure: true,
        domain: "localhost",
        path: '/',
        maxAge: 60*60
    });

    return res.status(200).json({
        message: "Successfully logged in"
    });
    }
}

module.exports = authController;