require('dotenv').config();

const userDao = require("../dao/userDao");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const { OAuth2Client } = require("google-auth-library");
const otpGenerator = require('otp-generator');
const emailService = require("../services/emailService");
const { validationResult } = require("express-validator");
const { ADMIN_ROLE } = require("../utility/userRoles")


//because passwords are sensitive information we wont send them as params. sensitive info majorly travels as body of the req
const authController = {
    register: async (req, res) => {
        const { username, email, password } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await userDao.create({
            username: username,
            email: email,
            password: hashedPassword,
            role: ADMIN_ROLE
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
                maxAge: 60 * 60 * 1000
            });

            return res.status(200).json({
                username: u.username,
                email: u.email,
                message: "Successfully registered in"
            });
        })
            .catch((error) => {
                if (error.code === 'USER_EXISTS') {
                    return res.status(400).json({
                        message: "User with this email already exists! Try loggin in."
                    })
                } else {
                    return res.status(500).json({
                        message: "internal server error!"
                    })
                }
            })
    },

    login: async (req, res) => {
        const { email, password } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const user = await userDao.findByEmail(email);
        if (!user) {
            return res.status(404).json({
                message: `User with email ${email} not found`
            });
        }

        user.role = user.role ? user.role : ADMIN_ROLE;

        user.adminId = user.adminId ? user.adminId : user.id;
        await user.save();

        const userUpdated = await userDao.findByEmail(user.id);

        console.log("upadted userr is here !!! " + userUpdated);


        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Incorrect password"
            });
        }

        const token = jwt.sign({ //creating a token using .sign() method
            username: user.username,
            email: user.email,
            id: user._id,
            role: user.role ? user.role : ADMIN_ROLE,
            adminId: user.adminId ? user.adminId : user.id
        }, process.env.JWT_SECRET, {
            expiresIn: '1h'
        })

        const refreshToken = jwt.sign({
            username: user.username,
            email: user.email,
            id: user._id
        }, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: '7d' //refresh token valid for 7 days
        })

        res.cookie('jwt', token, { //attaching the jwt token to the response cookies
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: '/',
            maxAge: 60 * 60 * 1000 // 1 hour
        });

        res.cookie('refreshJwt', refreshToken, { //attaching the refresh token to the response cookies
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            username: user.username,
            email: user.email,
            message: "Successfully logged in"
        });
    },

    getUser: async (req, res) => {
        try {
            const token = req.cookies?.jwt

            if (!token) {
                return res.status(401).json({
                    message: 'Unauthorized access'
                })
            }

            jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
                if (error) {
                    return res.status(401).json({
                        message: 'Invalid token'
                    })
                }
                else {
                    console.log("user from token: ", user);
                    return res.json({
                        user: user
                    })
                }
            }

            )
        }
        catch (error) {
            console.log(error);
            return res.status(500).json({
                message: 'internal server error'
            })
        }
    },

    logout: async (req, res) => {
        try {
            res.clearCookie("jwt", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/"
            });


            res.json({
                message: 'logout successfull'
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: 'Internal server error'
            })
        }
    },

    googleSso: async (req, res) => {
        try {
            console.log("REQ BODY:", req.body);

            const { idToken } = req.body;

            if (!idToken) {
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
            const { sub: googleId, name, email } = payload;

            let user = await userDao.findByEmail(email);
            user.role = user.role ? user.role : ADMIN_ROLE;

            user.adminId = user.adminId ? user.adminId : user.id;
            await user.save();

            if (!user) {
                user = await userDao.create({
                    username: name,
                    email: email,
                    googleId: googleId
                })
            }

            const token = jwt.sign({
                username: user.username,
                email: user.email,
                id: user._id
            }, process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.cookie("jwt", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 60 * 60 * 1000
            })

            return res.status(200).json({
                username: user.username,
                email: user.email,
                message: "Google login successful"
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "internal server error"
            })
        }
    },

    hasPassword: async (req, res) => {

        try {
            const { email } = req.body;
            const user = await userDao.findByEmail(email);

            if (!user) {
                return res.status(404).json({ googleOnly: false });
            }

            return res.status(200).json({
                hasPassword: Boolean(user.password)
            });

        } catch (error) {
            return res.status(500).json({
                hasPassword: false
            })
        }
    },

    generateCode: async (req, res) => { //using otp-generator package
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    message: "Email is required."
                })
            }

            const user = await userDao.findByEmail(email);

            if (!user) {
                return res.status(404).json({
                    message: "User not found"
                })
            }

            const code = otpGenerator.generate(6, {
                digits: true,
                alphabets: false,
                upperCase: false,
                specialChars: false
            });

            user.code = code;
            user.codeExpiresAt = Date.now() + 5 * 60 * 1000; //setting the expiry time for 5 minutes from now
            await user.save();

            await emailService.send(email, "Password Reset Code",
                `${code}`
            );

            return res.status(200).json({
                message: "email with code sent to user",

            })
        } catch (error) {
            console.log(error);

            return res.status(500).json({
                message: "Internal server error"
            })
        }
    },


    verifyCode: async (req, res) => {
        const { code, email } = req.body;

        try {
            const user = await userDao.findByEmail(email);

            if (!user || !user.code || !user.codeExpiresAt) {
                return res.status(404).json({
                    message: "User not found or code not generated"
                })
            }

            if (user.codeExpiresAt < Date.now()) { //checking if code has expired
                return res.status(404).json({
                    message: "Code has expired"
                })
            }

            if (user.code != code) {
                return res.status(404).json({
                    success: false,
                    message: "Invalid code"
                })
            }

            user.code = null;
            user.codeExpiresAt = null;

            await user.save();
            return res.status(200).json({
                success: true,
                message: "Code verified!"
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            })
        }
    },

    resetPassword: async (req, res) => {
        try {
            const { email, newPassword } = req.body;

            const user = await userDao.findByEmail(email);

            if (!user) {
                return res.status(404).json({
                    message: "User not found"
                })
            }
            user.password = await bcrypt.hash(newPassword, 10);
            await user.save();
            return res.status(200).json({
                message: "Password reset successful"
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "Internal server error"
            })
        }
    }
}

module.exports = authController;