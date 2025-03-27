import Post from "../models/posts.model.js"
import User from "../models/users.model.js"
import Comment from "../models/comments.model.js"


export const runningCheck=async(requestAnimationFrame,res)=>{
    return res.status(200).json({message:"RUNING"})
}

export const createPost=async(req,res)=>{

    const {token}=req.body

    try{
        const user=await User.findOne({token:token})

        if(!user){
            return res.status(404).json({message:"User not found"})
        }

        const newPost=new Post({
            userId:user._id,
           body:req.body.body,
           media:req.file!==undefined?req.file.filename:"",
           fileType:req.file!==undefined?req.file.mimetype.split("/")[1]:""
        })

        await newPost.save()

        return res.status(200).json({message:"Post created successfully"})

    }catch(error){
        return res.status(500).json({message:error.message})
    }
    
}

export const getAllPosts=async(req,res)=>{
    try{
      const posts=await  Post.find().populate("userId","name email username profilePicture")
      
  
      return res.json({posts})
    }catch(error){
      return res.status(500).json({message:error.message})
    }
  }

export const deletePost=async(req,res)=>{
    const {token,post_id}=req.body

    try{
        const user=await User.findOne({token:token}).select("_id")

        if(!user){
            return res.status(404).json({message:"User not found"})
        }

        const post=await Post.findOne({_id:post_id})

        if(!post){
            return res.status(404).json({message:"Post not found"})
        }

        if(post.userId.toString()!==user._id.toString()){
            return res.status(403).json({message:"You can't delete this post"})
        }

        await Post.deleteOne({_id:post_id})

        return res.status(200).json({message:"Post deleted successfully"})

        

    }catch(error){
        return res.status(500).json({message:error.message})
    }


}

export const get_comments_by_post=async(req,res)=>{
    const {post_id}=req.query

    console.log("POST_ID",post_id)

    try{
        const post=await Post.findOne({_id:post_id})

        if(!post){
            return res.status(404).json({message:"Post not found"})
        }

        const comments=await Comment.find({postId:post_id}).populate("userId","name username") 

        return res.json(comments.reverse())
    }catch(error){
        return res.status(500).json({message:error.message})
    }
}

export const delete_coment_of_user=async(req,res)=>{

    const {token,coment_id}=req.body

    try{
        const user=await User.findOne({token:token}).select("_id")

        if(!user){
            return res.status(404).json({message:"User not found"})
        }

        const comment=await Comment.findOne({"_id":coment_id})


        if(!comment){
            return res.status(404).json({message:"Comment not found"})
        }

        if(comment.userId.toString()!==user._id.toString()){
            return res.status(403).json({message:"You can't delete this comment"})
        }

        await Comment.deleteOne({"_id":coment_id})

        return res.status(200).json({message:"Comment deleted successfully"})
    }catch(error){
        return res.status(500).json({message:error.message})
    }
}

export const increment_likes=async(req,res)=>{

    const {post_id}=req.body
    try{
        const post=await Post.findOne({_id:post_id})

        if(!post){
            return res.status(404).json({message:"Post not found"})
        }

        post.likes+=1

        await post.save()

        return res.status(200).json({message:"Likes incremented successfully"})



    }catch(error){
        return res.status(500).json({message:error.message})
    }
}

export const commentPost=async(req,res)=>{

    const {token,post_id,commentBody}=req.body
    try{
      const user=await User.findOne({token:token}).select("_id")
  
      if(!user){
        return res.status(404).json({message:"User not found"})
      }
  
      const post = await Post.findOne({ _id: post_id });
  
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
  
      const comment=new Comment({
        userId:user._id,
        postId:post_id,
        body:commentBody
      })
  
      await comment.save()
  
      return res.json({message:"Comment added successfully"})
      
  
      
  
    }catch(error){
      return res.status(500).json({message:error.message})
    }
  }