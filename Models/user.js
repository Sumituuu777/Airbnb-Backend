const mongoose= require("mongoose");

const userSchema=new mongoose.Schema({
    firstname:{type:String,required:true},
    lastname:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    userType:{type:String,required:true,enum:['guest','host']},
    favoritesHomes:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Home'
    }],
    otp:{
        type:String,
        required:false
    },
    otpExpiry:{
       type:Date,
        required:false 
    }
});
module.exports=mongoose.model('User',userSchema)