import fs from 'fs'
//user otp schema
import userOtp from '../models/otp.js'
//import schema
import userschema from '../models/user.js'
//import bcrypt for password hash or compire
import bcrypt from 'bcrypt'
//import nodemail
import nodemailerConfig from '../config/node-mailer.js'
//import jwt token
import jwt from 'jsonwebtoken'



// user Registration
export const register = async (req, res) =>{
  try {
     const {name, email, username, password } = req.body
    //check username and email exist or not
      userschema.findOne({$or:[{username:username}, {email:email} ] }, (err , user)=>{
      if(err) return res.send(err)
      if(user) return res.status(409).json({msg: user.email === req.body.email ? 'Email aready exist': 'username already exist'})

      //trim white space
      if(!email.trim() || !username.trim() || !password.trim()){
        return res.status(400).json({ msg: "All fields are required and cannot be blank" })
      }else{
     //if username and email not exist then save to database
     if (req.body) {
      // generate random 6 digit code
      const randomNumber = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000
      const otp = randomNumber
      //jwt token sign
      const token = jwt.sign({
        username : username
    }, process.env.JWT_SECRET , { expiresIn : "3min"})
      
      //store all data to user otp collection
      const userotp = new userOtp({
        name:name,
        username:username,
        email:email,
        password:password,
        otp: otp,
        token:token
      })

      //after add info save it for temporary
      userotp.save()

      //mail details
      const mailOptions = {
        from: `chat app <${process.env.GMAIL}>`,
        to: `${email}`,
        subject: 'OTP for your account',
       
      }
      //custom email template
      fs.readFile('./config/nodemailer-template/otp-template.html' , 'utf-8' , (err , data)=>{
      if (err) {
      console.error(err);
      return;
      }
      //dynamic code replace in html template
      mailOptions.html = data.replace(/{OTP}/g, otp).replace(/{NAME}/g, name)
      //send mail
      nodemailerConfig.transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
      });

      } )
      res.status(201).send({msg:'An OTP sent to your email!', otpPage:true, token: token})
      console.log(otp)
     } else { 
      res.status(401).send({msg:'OTP not sent, something wrong!'})
     }
      }

    })

  } catch (error) {
    res.status(500).send(error)
  }

} 


//otp verification
export const otp = async (req, res)=>{

  try {
      //check undefiend headers
      if(req.headers.authorization === undefined){
        res.status(400).send({msg:'Need token'})
      }else{
        //collect otp from body
      const otp = req.body
        //split the bearer token
        let token
        const {authorization} = req.headers
        token = authorization.split(' ')[1]
       
        //verify the jwt token with jwt secret
        jwt.verify(token, process.env.JWT_SECRET, (err, user)=>{
          if(err) return res.status(400).send({msg:'OTP expired'})
          if(user){


          //find the user in otp collection using token
          userOtp.findOne({ token:token }, (err, users) => {
          if(err) return res.send('err')
          if(users){
          //if find then match the token
          if(users.token === token) {

            if(Object.keys(otp.code).length === 0){
              res.status(400).send({msg:'please enter code'})
            }else{
                //compare the pass that store in database as an encryped form
                bcrypt.compare(otp.code, users.otp , (err, result)=>{
                  if(err) return res.status(400).send({msg:'error'})
                  if(result){
                  //if success then find it and delete using token
                   userOtp.findOneAndDelete({token:token}, (err, success)=>{
                    if(err) return res.status(400).send({msg:'Error'})
                    if(success){
                  //Refresh Token
                    const refreshToken = jwt.sign({
                        username : success.username
                    }, process.env.JWT_SECRET_REFRESH , { expiresIn : "1y"});
                  //after delete stored data to main collection
                   const userData = new userschema({ 
                      name:success.name,
                      username:success.username,
                      email:success.email,
                      password:success.password,
                      refreshToken: refreshToken
                  
                    })
                    //saved user
                    userData.save((err,saved)=>{
                      if(err) return res.status(400).send({msg:'Error'})
                      if(saved){
                         //jwt access token sign
                          const token = jwt.sign({
                          username : saved.username
                          }, process.env.JWT_SECRET , { expiresIn : "3min"});

                        res.status(201).send({msg:'verified' , otpPage:false, AccessToken:token, RefreshToken:refreshToken})
                        console.log(saved)
                      }
                    })
      
                    }
                   }) 
      
                  }else{
                    res.status(404).send({msg:'invalid code'})
                    
                  }
                })
            }



                  
          }
      
        }else{
          res.status(404).send({msg:'OTP expired or invalid!'})
        }
      
        })
            

          }else{

          


           res.status(400).send({msg:'otp expired'})
          }
        })

      
        
      } 

    } catch (error) {
     
      console.log(error)
    }
      
}


//Resend OTP
export const resendotp = async(req, res)=>{
  try {
    //checking undefiend headers
    if(req.headers.authorization === undefined){
      res.status(400).send({msg:'Need token'})
    }else{
    //split token
    let token
    const {authorization} = req.headers
    token = authorization.split(' ')[1]

    //generate random number
    const randomNumber = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000
    //store it in as a string form
    const otp = randomNumber.toString()
    //hasing the opt
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(otp, salt);
   //find it using token
   userOtp.findOne({token:token}, (err, found)=>{
    if(err) return res.send({msg: 'err'})
    if(found){
      //if token matched
      if(found.token === token){
            //jwt resend token generate
      const resendtoken = jwt.sign({
      username : found.username
      }, process.env.JWT_SECRET , { expiresIn : "3min"});
        //update the user
        userOtp.findOneAndUpdate({token:token}, {$set:{otp:hash, token:resendtoken}}, (err, update)=>{
          if(err) return res.status(400).send({msg:'Error'})
          if(update){
            //send new otp using mail
            const mailOptions = {
              from: `chat app <${process.env.GMAIL}>`,
              to: `${found.email}`,
              subject: 'New OTP for your account',
             
            }
            //custom email template
            fs.readFile('./config/nodemailer-template/otp-template.html' , 'utf-8' , (err , data)=>{
            if (err) {
            console.error(err);
            return;
            }
            //dynamic code replace
            mailOptions.html = data.replace(/{OTP}/g, otp).replace(/{NAME}/g, found.name)
            //send mail
            nodemailerConfig.transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
            });
      
            })
            res.status(201).send({msg:'A new OTP sent to your Email', resendTokn: resendtoken})
            
          }else{
            res.status(400).send({msg:'There was an error!'})
          }
        }) 
      }
    }else{
      res.status(409).send({msg: 'inauthentic user'})
    }
   })

    }  

  } catch (error) { 
    console.log(error)
  }

}



//post request for login
export const login = async(req , res) =>{
  
  try {
    const {username, email, password} = req.body
    userschema.findOne({$or:[{username:username},{email:email}]}, async (err, user) =>{
    if(err) return res.status(400).send(err)
    if(!user) return res.status(404).send({msg:'User not found'})
 
    //compare the entered password with database password
  bcrypt.compare(password, user.password ,(err , result)=>{
      if(err) return res.status(400).send(err)
      if(!result) return res.status(400).json({ msg: "Username or Password Incorrect" }) 
      
      // req.session.user_id = user._id
      res.json({ msg: `welcome back ${user.name}!` , token:true})
      
      // if(result) {
       
      //   res.status(201).send({'msg':'login success'})
      //   req.session.user_id = user._id
      //  console.log(req.session.user_id)
      
      // }else{
      //    res.status(401).send({'msg':'incorrect username or password'})
        

      // } 
      
    })

  // bcrypt.compare(password, user.password).then((isMatch)=>{
  //   if(!isMatch) return res.status(400).json({ msg: "Invalid credentials" });
  //   req.session.user_id = user._id
  //   console.log(req.session.user_id)
  //   res.json({ msg: " Logged In Successfully" });
  // })




     
    }) 

   
  } catch (error) {
     
    res.send(error)
   }
}



// admin dashbord

// export const adminDashboard = async(req, res)=>{
//   try {
//     const {email} = req.session.userInfo
//     if ( req.session.user_id || req.session.user_id === email && req.session.otp.code ) {
//       console.log(req.session.user_id)
//       res.send('Welcome to the dashboard');
//     } else {
//       res.send('Please login to access the dashboard');
//     }
//   } catch (error) {
//     console.log(error)
//     res.send(error)
//   }
// }

// export const logOut = (req ,res) =>{
//    req.session.destroy((error)=>{
    
//     res.clearCookie('login')
//     res.send('logout successfull')
//    });
// }


 
// export const ip = app.use((req, res, next) => {
  
//     console.log(req.ip);
//     next();
//   });


