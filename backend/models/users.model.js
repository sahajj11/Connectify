import mongoose from "mongoose";

const UsersSchema=new mongoose.Schema({
    
    name:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    username:{
        type:String,
        required:true,
        unique:true

    },
    email:{
        type:String,
        required:true,
        unique:true

    },
    
    createdAt:{
        type:Date,
        default:Date.now

    },
    profilePicture:{
        type:String,
        default:"default.jpg"

    },
    token:{
        type:String,
        default:""
    }
})

const User=mongoose.model("User",UsersSchema)

export default User