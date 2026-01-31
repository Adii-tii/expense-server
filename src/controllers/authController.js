require('dotenv').config();

const userDao = require("../dao/userDao");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const { OAuth2Client } = require("google-auth-library");

//because passwords are sensitive information we wont send them as params. sensitive info majorly travels as body of the req
const authController = {
    register : async(req,res) => {
        const {username, email, password} = req.body;

    if(!username || !email || !password){
        return res.status(400).json({
            messages: 'Name, email and password are required!'
        })
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await userDao.create({
        username : username,
        email : email,
        password : hashedPassword
    }).then(u => {
        console.log(u);

        const token = jwt.sign({ //creating a token using .sign() method
            username: u.username,
            email: u.email,
            id: u._id
        }, process.env.JWT_SECRET, {
            expiresIn: '1h'
        })

        res.cookie('jwt', token, { //attaching the jwt token to the response cookies
            httpOnly: true, 
            secure: process.env.NODE_ENV === "production",
            path: '/',
            maxAge: 60*60*1000
        });
        
        return res.status(200).json({
            username: u.username,
            email: u.email,  
            message: "Successfully registered in"
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
        return res.status(404).json({
            message: `User with email ${email} not found`
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(400).json({
            message: "Incorrect password"
        });
    }

    const token = jwt.sign({ //creating a token using .sign() method
        username: user.username,
        email: user.email,
        id: user._id
    }, process.env.JWT_SECRET, {
        expiresIn: '1h'
    })

    res.cookie('jwt', token, { //attaching the jwt token to the response cookies
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",
        path: '/',
        maxAge: 60*60*1000
    });

    return res.status(200).json({
        username: user.username,
        email: user.email,  
        message: "Successfully logged in"
    });
    },

    isLoggedIn: async(req, res) => {
        try{
            const token = req.cookies?.jwt
            
            if(!token){
                return res.status(401).json({
                    message: 'Unauthorized access'
                })
            }

            jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
                if(error){
                    return res.status(401).json({
                        message: 'Invalid token'
                    })}
                else{
                        return res.json({
                            user:user
                        })
                    }
                }
                
            )}
        catch(error){
            console.log(error);
            return res.status(500).json({
                message: 'internal server error'
            })
        }
    },

    logout: async(req,res) => {
        try{
            res.clearCookie("jwt", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/"
            });


            res.json({
                message: 'logout successfull'
            });
        } catch(error){
            console.log(error);
            return res.status(500).json({
                message: 'Internal server error'
            })
        }
    },

    googleSso: async(req,res) => {
        try{
            console.log("REQ BODY:", req.body);  

            const {idToken} = req.body;

            if(!idToken){
                return res.status(401).json({
                    message: "invalid request"
                });
            }

            const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
            
            const googleResponse = await googleClient.verifyIdToken({
                idToken: idToken,
                audience: process.env.GOOGLE_CLIENT_ID            
            })

            const payload = googleResponse.getPayload();
            const {sub: googleId, name, email} = payload;

            let user = await userDao.findByEmail(email);

            if(!user){
                user =  await userDao.create({
                    username:name,
                    email:email,
                    googleId: googleId
                })
            }

            const token = jwt.sign({
                username: user.username,
                email: user.email,
                id:user._id
            }, process.env.JWT_SECRET,
            {expiresIn : "1h"}
            );

            res.cookie("jwt", token, {
                httpOnly:true,
                secure: process.env.NODE_ENV==="production",
                path:"/",
                maxAge: 60*60*1000            
            })

            return res.status(200).json({
                username: user.username,
                email: user.email,
                message: "Google login successful"
            });

        }catch(error){
            console.log(error);
            return res.status(500).json({
                message: "internal server error"
            })
        }
    },

    hasPassword: async(req, res) => {
    
        try{
            const {email} = req.body;
            const user = await userDao.findByEmail(email);
            
            if (!user) {
            return res.status(404).json({ googleOnly: false });
            }

            return res.status(200).json({
            hasPassword: Boolean(user.password)
            }); 

        } catch (error){
            return res.status(500).json({
                hasPassword: false
            })
        }
    }

}

module.exports = authController;