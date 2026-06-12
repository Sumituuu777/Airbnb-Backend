const {check, validationResult}=require('express-validator')
const User = require('../Models/user')
const bcrypt=require('bcryptjs');
const sgMail=require('@sendgrid/mail');
require('dotenv').config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

exports.getlogin=(req,res,next)=>{
    res.render('auth/login',{title:'login',isLoggedIn: false})
}

exports.getForgotPass=(req,res,next)=>{
    res.render('auth/forgot',{title:'Forgot Passworrd',isLoggedIn: false,user: req.session.user})
}

exports.getResetPass=(req,res,next)=>{
    const {email}=req.query;
    res.render('auth/reset-password',{title:'Reset Passworrd',isLoggedIn: false,user: req.session.user,
        email:email
    })
}

exports.postResetPass=[
     
    // password
    check('password')
    .isLength({min:8})
    .withMessage("password must be of atleast 8 characters")
    .matches(/[a-z]/)
    .withMessage('password must contain atleast one lowercase alphabet')
    .matches(/[A-Z]/)
    .withMessage('password must contain atleast one uppercase alphabet')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("password must contain atleast one special character")
    .trim(),

    check('confirm_password')
    .trim()
    .custom((value,{req})=>{
        if(value!=req.body.password){
            throw new Error('Password do not match')
        }
        return true;
    }),
    async (req,res,next)=>{
        const {email,otp,password,confirm_password}=req.body
        try{
            const user=await User.findOne({email:email});
            if(!user){
                throw new Error('No user found with this email')
            }else if(user.otpExpiry < Date.now()){
                throw new Error('OTP expired ')
            }else if(user.otp!=otp){
                throw new Error("Invalid OTP")
            }
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.render('auth/reset-password', {
                    title: 'Reset Password',
                    isLoggedIn: false,
                    errorMessages: errors.array().map(err => err.msg),
                    email: req.body.email,
                    user: req.session.user
                });
            }

            const hashedpassword=await bcrypt.hash(password,12);
            user.password=hashedpassword;
            user.otp=undefined;
            user.otpExpiry=undefined;
            await user.save();

            return res.redirect("/login")

        }catch(err){
            console.log("Error in reset password",err);
            return res.render('auth/reset-password', 
                {title:'Reset Password',
                isLoggedIn: false,
                errorMessages: [err.message],
                email:email,
                user:req.session.user
            })
        }
    }


]

exports.getsignup=(req,res,next)=>{
    res.render('auth/signup',{title:'signup',isLoggedIn: false})
}

exports.postlogin= async (req,res,next)=>{
    const {email,password}=req.body;
    
    try{
        const user=await User.findOne({email:email});
        if(!user){
            return res.render('auth/login',
                {title:'login',
                isLoggedIn: false,
                errorMessages: 'Invalid Email'
            })
        }
        const isMatch= await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.render('auth/login', 
                {title:'login',
                isLoggedIn: false,
                errorMessages: 'Invalid Password'
            })
        }
        req.session.isLoggedIn=true;
        req.session.user = {
            _id: user._id.toString(),
            email: user.email,
            firstname: user.firstname,
            userType: user.userType
        };
        req.session.save(err => {
            if (err) console.log(err);
        });
        if(user.userType==='guest'){  res.redirect('/availablehomes');}
        else{ res.redirect('/host/host-homes')}
    }
    catch(err){
        console.log('err while logging in',err); 
    }
    
}
exports.postForgotPass= async (req,res,next)=>{
    const {email}=req.body;
    
    try{
        const user=await User.findOne({email:email});
        if(!user){
            return res.render('auth/forgot',
                {title:'Forgot password',
                isLoggedIn: false,
                user: req.session.user,
                errorMessages: 'No account found with this Email'
            })
        }

        const otp=Math.floor(100000+Math.random()*900000).toString()
        user.otp=otp;
        user.otpExpiry=Date.now() + 20*60*1000
        await user.save()

        const otpmail={
                to:email,
                from:process.env.MAIL_SENDER,
                subject:'Reset password OTP',
                html : `<h2> ${otp}</h2><p>is your otp for reseting password.Do not share it with anyone. OTP is valid for 5 minutes.</p><br><p>-airbnb team</p>`
            };
            await sgMail.send(otpmail);

        return res.redirect(`/reset-password?email=${email}`)
    }
    catch(err){
        console.log('err in forgot password',err);
        return res.render('auth/forgot',
                {title:'Forgot password',
                isLoggedIn: false,
                user: req.session.user,
                errorMessages: [err.message]
            }) 
    }
    
}

exports.postsignup=[
    // for firstname
    check('firstname')
    .notEmpty()
    .withMessage('first name cannot be Empty')
    .trim()
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('first name can only contain alphabets'),

    // for lastname
    check('lastname')
    .notEmpty()
    .withMessage('last name cannot be Empty')
    .trim()
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('last name can only contain alphabets'),

    // for Email
    check('email')
    .isEmail()
    .withMessage('Enter a valid Email')
    .normalizeEmail(),

    // password
    check('password')
    .isLength({min:8})
    .withMessage("password must be of atleast 8 characters")
    .matches(/[a-z]/)
    .withMessage('password must contain atleast one lowercase alphabet')
    .matches(/[A-Z]/)
    .withMessage('password must contain atleast one uppercase alphabet')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("password must contain atleast one special character")
    .trim(),

    check('confirm_password')
    .trim()
    .custom((value,{req})=>{
        if(value!=req.body.password){
            throw new Error('Password do not match')
        }
        return true;
    }),

    (req,res,next)=>{
        const {firstname,lastname,email,password,userType}=req.body;
        const errors=validationResult(req)

        if(!errors.isEmpty()){
            return res.status(422).render('auth/signup',{
                title:'signup',
                isLoggedIn: false,
                errorMessages:errors.array().map(error=>error.msg),
                oldInput:req.body
            })
        }
        bcrypt.hash(password,12).then(hashedpassword=>{
        const user=new User({
                    firstname,
                    lastname,
                    email,
                    password: hashedpassword,
                    userType
            })
            return  user.save();
        })
        .then(()=>{
            const msg={
                to:email,
                from:process.env.MAIL_SENDER,
                subject:'Welcome to airbnb',
                html : `<h2>welcome ${firstname}, to airbnb.start booking homes for your vacation or host your homes on daily rent basis</h2><br><p>Best regards-</p><br><p>airbnb team</p>`
            };
            return sgMail.send(msg);
        })
        .then((result)=>{
            res.redirect('/login');
        })
        .catch((err)=>{
            res.status(422).render('auth/signup',{
                title:'signup',
                isLoggedIn: false,
                errorMessages:[err],
                oldInput:{
                    firstname,
                    lastname,
                    email,
                    password,
                    userType
                }
            })
        })
   
    }
]
exports.postlogout=(req,res,next)=>{
    req.session.destroy(()=>{
        res.redirect('/login')
    })
    
};