import express, { Express, Request, Response , Application, NextFunction} from 'express';
import User from '../model/schema';
import jobCaterogry from '../model/jobcaterogry';
import job from '../model/job';
import { RequestHandler } from 'express';
import {genSaltSync, hashSync, compareSync} from 'bcrypt';
import jwt from 'jsonwebtoken';
import {sendMail} from '../helper/emailer';
export const register: RequestHandler = async (req, res, next) => {
    try {
      const { name, email, password} = req.body;
      //for validation
      const expression: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
          const pass:RegExp=  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&^])[A-Za-z\d@.#$!%*?&]{8,15}$/;
      
          // check input for validation
          if (!pass.test(password.toString())) {
            return res.status(407).json({ message: 'Enter valid password with uppercase, lowercase, number & @' });
          }
          if (!expression.test(email.toString())) {
            return res.status(407).json({ message: 'Enter valid email' });
          }
  
      const existinguser = await User.findOne({ email });
  //if user is already exist
      if (existinguser) {
        return res.status(407).json({ message: 'User already Exist' });
      }
      //hashing password
      const salt = genSaltSync(10);
      const hashPassword = hashSync(password, salt);
      const newUser = new User({
        name,
        email,
        password: hashPassword,
  
      });
      //save new user
      await newUser.save();
      res.status(200).json({ message: 'registred successfully' })
  
    } catch (err) {
      res.status(407).json({ message: err });
  
    }
  
  };
  //for signing in
  export const signIn:RequestHandler = async(req, res, next) => {
    
  
    try{
        const {email,password} = req.body ;
        const user = await User.findOne({email}) ;
  
        // Checking if the email exists in database 
        if(!user){
            return res.status(400).json({ok:false,message:"Invalid Credentials"}) ;
        }
  
        // comapring password entered with database hashed Password
        const isPasswordMatch = await compareSync(password,user.password) ;
        if(!isPasswordMatch){
            return res.status(400).json({ok:false,message:"Invalid Credentials"}); 
        }
  
        // Generating tokens
        const authToken = jwt.sign({userId : user.id},process.env.JWT_SECRET_KEY||" ",{expiresIn : '30m'}) ;
        const refreshToken = jwt.sign({userId : user.id},process.env.JWT_REFRESH_SECRET_KEY||" ",{expiresIn : '2h'}) ;
  
        // Saving tokens in cookies 
        res.cookie('authToken',authToken,({httpOnly : true})) ;
        res.cookie('refreshToken',refreshToken,({httpOnly:true})) ;
  
        return res.status(200).json({ok:true,message : "Login Successful",userid:user.id}) ;
  
    }
    catch(err){
        next(err);
   }
    
  };
  export const signout:RequestHandler = (req, res, next) => {
    try{
      //clearing cookies
        res.clearCookie('authToken') ;
        res.clearCookie('refreshToken');
        return res.status(200).json({ok:true,message:"User has been logged out"}) ;
    }
    catch(err){
        next(err) ;
    }
  };

  
  export const CreateCaterogry:RequestHandler = async(req, res, next) => {
    try{
      const {category} = req.body;
    const existingCaterogry = await jobCaterogry.findOne({category});
    if(existingCaterogry){
        return res.status(400).json({ok:false,message:"Caterogry Already Exist"}) ;
    } 
    const newjobcaterogry = new jobCaterogry({category:category});
    await newjobcaterogry.save();
    return res.status(200).json({ok:true,message:"Caterogry Added Successfully"}) ;
    }catch (err: any) {
      console.log(err.message);
      res.status(500).json({
          message: "Error creating job category..."
      });
  }

  }
  export const CreateInterest:RequestHandler = async(req, res, next)=>{
    try{
      const {interest} = req.body;
      const exisitngIntererst = await jobCaterogry.findOne({category:interest});
      if(!exisitngIntererst){
        return res.status(400).json({ok:false,message:"Add caterogry first"});
      }
      const user = await User.findById(req.userId);
      if(!user){
        return res.status(404).json({
          message: "User not found...",
        });
      }
      if(user.interest.indexOf(exisitngIntererst._id)>-1){
        return res.status(200).json({ok:true,message:"interest already present"});

      }
      user.interest.push(exisitngIntererst._id);
      exisitngIntererst.interestedUsers.push(user.email);
      await user.save();
      await exisitngIntererst.save();
      return res.status(200).json({ok:true,message:"interest added successfully"});  

    }catch (err) {
      res.status(500).json({
        message: "Error creating job interest..."
      });
    }
  }
  export const JobPosting:RequestHandler = async(req, res, next)=>{
   try{
    const {title, description, category} = req.body;
    const existingCaterogry = await jobCaterogry.findOne({category});
    if(!existingCaterogry){
      return res.status(400).json({ok:false,message:"Add caterogry first"});
    } 
    const EmailinterestedUsers:String[] = existingCaterogry.interestedUsers;
    if(EmailinterestedUsers.length!=0){
      sendMail(EmailinterestedUsers, "Job Alert", `Your interest job ${category} has been posted on portal`);

    }
   
    const user = await User.findById(req.userId);
    if(!user){
      return res.status(404).json({
        message: "User not found...",
      });
    }
    const newJob = new job({
      title,
      description,
      caterogry:existingCaterogry._id,
      owner:user._id
    })
    await newJob.save();
    return res.status(200).json({ok:true,message:"Job Posted Successfully"});
    }catch(err){
      res.status(500).json({
        message: "Error in job posting..."
      });

    }
   }
  export const ApplyJob:RequestHandler = async (req, res) => {
   try{
    const id = req.userId;
    const {jobId} = req.body;
    const user = await User.findById(id);
    if(!user){
      return res.status(404).json({
        message: "User not found...",
      }); 
    }
    const myjob = await job.findById(jobId);
    if(!myjob){
      return res.status(404).json({
        message: "Job not found...",
      }); 
    }
    if(myjob.AppliedUser.indexOf(user._id)>-1){
      return res.status(400).json({
        message: "You have already applied for this job",
      });
    }
    myjob.AppliedUser.push(user._id); 
    await myjob.save();
    return res.status(200).json({ok:true,message:"Applied Successfully"});  

   }catch(err){
     res.status(500).json({
       message: "Error in applying job..."
     });  
   }

   }

  



  
  