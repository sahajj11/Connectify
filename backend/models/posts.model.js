import mongoose from "mongoose";

const PostsSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"

    },
    body:{
        type:String,
        required:true

    },
    createdAt:{
        type:Date,
        default:Date.now

    },
    likes:{
        type:Number,
        default:0

    },
    updatedAt:{
        type:Date,
        default:Date.now

    },
    media:{
        type:String,
        default:""

    },
    active:{
        type:Boolean,
        default:true

    },
    fileType:{
        type:String,
        default:""

    }
})

const Post=mongoose.model("Post",PostsSchema)

export default Post