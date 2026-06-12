//core modules
const express=require('express');
const { getlogin, postlogin, postlogout, getsignup, postsignup, getForgotPass, postForgotPass, getResetPass, postResetPass } = require('../controllers/authcontroller');
//local modules
const authRouter=express.Router();

authRouter.get("/login",getlogin)
authRouter.get("/forgot-password",getForgotPass)
authRouter.get("/reset-password",getResetPass)
authRouter.post("/login",postlogin)
authRouter.post("/logout",postlogout)
authRouter.get("/signup",getsignup)
authRouter.post("/signup",postsignup)
authRouter.post("/forgot-password",postForgotPass)
authRouter.post("/reset-password",postResetPass)

//named export
exports.authRouter=authRouter;