import { Router } from "express";
import { commentPost, createPost, delete_coment_of_user, deletePost, get_comments_by_post, getAllPosts, increment_likes, runningCheck } from "../controllers/posts.controller.js";
import multer from "multer";

const router=Router()

const storage=multer.diskStorage({
  destination:(req,file,cb)=>{
    cb(null,"uploads/")
  },
  filename:(req,file,cb)=>{
    cb(null,file.originalname)
  }
})

const upload=multer({storage:storage})

router.route("/").get(runningCheck)
router.route("/post").post(upload.single("media"),createPost)
router.route("/posts").get(getAllPosts)
router.route("/delete_post").delete(deletePost)
router.route("/comment").post(commentPost)
router.route("/get_comments").get(get_comments_by_post)
router.route("/delete_comments").delete(delete_coment_of_user)
router.route("/increment_post_like").post(increment_likes)

export default router