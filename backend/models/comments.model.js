import mongoose from "mongoose";

const ComentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
  },
  body:{
    type:String,
    default:""
  }
});

const Comment = mongoose.model(
  "Comment",
  ComentSchema
);
export default Comment;
