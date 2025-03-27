import Profile from "../models/profile.model.js";
import User from "../models/users.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import fs from "fs";
import ConnectionRequest from "../models/connection.model.js";
import Post from "../models/posts.model.js";
import Comment from "../models/comments.model.js";


const convertUserDataToPDF=async(userData)=>{
  const doc=new PDFDocument()

  const outputPath=crypto.randomBytes(32).toString("hex") + ".pdf"
  const stream=fs.createWriteStream("uploads/" + outputPath)

  doc.pipe(stream)

  let yPosition = 50;

  doc.image(`uploads/${userData.userId.profilePicture}`, { width: 100}).moveDown()
  yPosition += 120; // Adjust Y position to move text below image

  // Move the cursor down before adding text
  doc.moveTo(50, yPosition); 

  doc.fontSize(14).text(`Name: ${userData.userId.name}`)
  doc.fontSize(14).text(`Username: ${userData.userId.username}`)
  doc.fontSize(14).text(`Email: ${userData.userId.email}`)
  doc.fontSize(14).text(`Bio: ${userData.bio}`)
  doc.fontSize(14).text(`Current Position: ${userData.currentPosition}`)

  doc.fontSize(14).text("Past Work:")
  userData.pastWork.forEach((work,index)=>{
    doc.fontSize(14).text(`Company: ${work.companyName}`)
    doc.fontSize(14).text(`Position: ${work.position}`)
    doc.fontSize(14).text(`Duration: ${work.years}`)
  })

  doc.end() 

  return outputPath


}

export const register = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      username,
    });

    await newUser.save();

    const profile = new Profile({ userId: newUser._id });
    await profile.save();

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    // Ensure passwords match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");

    // Update user with the generated token
    user.token = token;
    await user.save(); // Ensure token is stored in the database

    return res.json({ message: "Login successful", token });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


export const uploadProfilePicture = async (req, res) => {
  const {token}=req.body

  try{

    console.log("Uploaded File:", req.file);
    console.log("User Token:", req.body.token);

    const user=await User.findOne({token:token})

    if(!user){
      return res.status(400).json({message:"Invalid token"})
    }

    user.profilePicture=req.file.filename

    await user.save()

    return res.status(200).json({message:"Profile picture uploaded successfully"})

  }catch(error){
    return res.status(500).json({message:error.message})
  }
}






export const updateUserProfile = async (req, res) => {

  try{
    const {token,...newUserData}=req.body

    const user=await User.findOne({token:token})

    if(!user){
      return res.status(404).json({message:"User Not Found"})
    }

    const {username,email}=newUserData

    const existingUser=await User.findOne({$or:[{username},{email}]})

    if(existingUser){
      if(existingUser || String(existingUser._id)!==String(user._id)){
      return res.status(400).json({message:"Username or Email already exists"})
      }
    } 

    Object.assign(user,newUserData)

    await user.save()

    return res.status(200).json({message:"User updated successfully"})



  }catch(error){
    return res.status(500).json({message:error.message})
  } 
}

export const getUserAndProfile = async (req, res) => {
  

  try{

    const { token } = req.query

   

    const user=await  User.findOne({token:token})

    if(!user){
      return res.status(404).json({message:"User not found"})
    }

    const userProfile=await Profile.findOne({userId:user._id})
    .populate("userId","name email username profilePicture")

    return res.json({ profile: userProfile })


  }catch(error){
    return res.status(500).json({message:error.message})
  }
}

export const updateProfileData=async(req,res)=>{

  try{
    
    const {token,...newProfileData}=req.body

    const userProfile=await User.findOne({token:token})

    if(!userProfile){
      return res.status(404).json({message:"User not found"})
    }

    const profile_to_update=await Profile.findOne({userId:userProfile._id})

    Object.assign(profile_to_update,newProfileData)

    await profile_to_update.save()

    return res.status(200).json({message:"Profile updated successfully"})

  }catch(error){
    return res.status(500).json({message:error.message})
  }
}

export const getAllUserProfile=async(req,res)=>{
  try{
    const profiles=await Profile.find().populate("userId","name email username profilePicture")

    return res.json({profiles})

  }catch(error){
    return res.status(500).json({message:error.message})
  }
}

// export const downloadProfile=async(req,res)=>{
//   const user_id=req.query.id

//   const userProfile=await Profile.findOne({userId:user_id}).populate("userId","name email username profilePicture")

//   let outputPath=await convertUserDataToPDF(userProfile)

//   return res.json({"message":outputPath})

// }

export const downloadProfile = async (req, res) => {
  try {
    const user_id = req.query.id;

    // Fetch user profile and populate the userId reference
    const userProfile = await Profile.findOne({ userId: user_id })
      .populate("userId", "name email username profilePicture");

    // Check if userProfile is found
    if (!userProfile) {
      return res.status(404).json({ error: "User profile not found" });
    }

    // Check if userProfile.userId exists
    if (!userProfile.userId || !userProfile.userId.profilePicture) {
      return res.status(400).json({ error: "Profile picture not found for this user" });
    }

    // Convert user data to PDF
    let outputPath = await convertUserDataToPDF(userProfile);

    return res.json({ message: outputPath });

  } catch (error) {
    console.error("Error downloading profile:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


export const sendConnectionRequest=async(req,res)=>{
  const {token,connectionId}=req.body

  try{
    const user=await User.findOne({token:token})

    if(!user){
      return res.status(404).json({message:"User not found"})
    }

    const connectionUser=await User.findOne({_id:connectionId})

    if(!connectionUser){
      return res.status(404).json({message  :"Connection user not found"})
    }

    const existingRequest=await ConnectionRequest.findOne({userId:user._id,connectionId:connectionUser._id})

    if(existingRequest){
      return res.status(400).json({message:"Connection request already sent"})
    }

    const request=new ConnectionRequest({userId:user._id,connectionId:connectionUser._id})

    await request.save()

    return res.json({message:"Connection request sent successfully"})

  }catch(error){
    return res.status(500).json({message:error.message})
  }
}

export const getMyConnectionRequests=async(req,res)=>{
  const token = req.headers.authorization?.split(" ")[1];
  console.log("Received Token:", token)

  try{
    const user=await User.findOne({token:token})

    if(!user){
      return res.status(404).json({message:"User not found"})
    }

    const connections=await ConnectionRequest.find({userId:user._id}).populate("connectionId","name email username profilePicture")

    return res.json({connections})

    

  }catch(error){
    return res.status(500).json({message:error.message})
  }

}



// export const getMyConnectionRequests = async (req, res) => {
//   const token = req.headers.authorization?.split(" ")[1];
//   console.log("Received Token:", token);

//   if (!token) {
//     return res.status(401).json({ message: "No token provided" });
//   }

//   try {
//     // Decode the token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET); // Ensure you have JWT_SECRET in your .env file
//     const userId = decoded.id; // Assuming your JWT payload contains 'id'

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const connections = await ConnectionRequest.find({ userId: user._id })
//       .populate("connectionId", "name email username profilePicture");

//     return res.json({ connections });

//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// };


export const whatAreMyConnections=async(req,res)=>{

  const {token}=req.query

  try{

    const user=await User.findOne({token:token})

    if(!user){
      return res.status(404).json({message:"User not found"})
    }

    const connections=await ConnectionRequest.find({connectionId:user._id}).populate("userId","name email username profilePicture")

    return res.json(connections)

  }catch(error){
    return res.status(500).json({message:error.message})
  }
}

export const acceptConnectionRequest=async(req,res)=>{

  const {token,requestId,action_type}=req.body
  try{
    const user=await User.findOne({token:token})

    if(!user){
      return res.status(404).json({message:"User not found"})
    }

    const connection=await ConnectionRequest.findOne({_id:requestId})

    if(!connection){
      return res.status(404).json({message:"Connection request not found"})
    }

    if(action_type==="accept"){
      connection.status_accepted=true
    }else{
      connection.status_accepted=false
    }

    await connection.save()

    return res.json({message:"Connection request updated successfully"})


  }catch(error){
    return res.status(500).json({message:error.message})
  }
}





export const getUserProfileAndUserBasedOnUsername=async(req,res)=>{

  const {username}=req.query

  try{
    const user=await User.findOne({username})

    if(!user){
      return res.status(404).json({message:"User not found"})
    }

    const userProfile=await Profile.findOne({userId:user._id}).populate("userId","name email username profilePicture")  
    
    return res.json({"profile":userProfile})
  }catch(error){
    return res.status(500).json({message:error.message})
  }

}