const express = require('express');
const {
 register,
 login
} = require('../controllers/authController');

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const db = require('../config/db');

const router = express.Router();



/* =========================
   EXISTING AUTH ROUTES
========================= */

router.post('/register', register);
router.post('/login', login);



/* =========================
   MFA SETUP (Generate QR)
========================= */

router.post('/mfa/setup', async (req,res)=>{

try{

 const userId=req.body.userId;

 const secret=
 speakeasy.generateSecret({
   name:'SecureVault'
 });

 db.query(
 `
 UPDATE users
 SET mfaSecret=?
 WHERE id=?
 `,
 [secret.base32,userId],
 async(err)=>{

   if(err){
    console.error(err);

    return res.status(500).json({
      error:'MFA setup failed'
    });
   }

   const qrCode=
   await QRCode.toDataURL(
     secret.otpauth_url
   );

   res.json({
    message:
    'Scan QR in authenticator',
    qrCode
   });

 });

}catch(err){

console.error(err);

res.status(500).json({
 error:'MFA setup failed'
});

}

});



/* =========================
VERIFY OTP + ENABLE MFA
========================= */

router.post('/mfa/verify',(req,res)=>{

 const { userId, token } = req.body;

 db.query(
  'SELECT mfaSecret FROM users WHERE id=?',
  [userId],

  (err,results)=>{

   if(err){
    console.error(err);

    return res.status(500).json({
      error:'Verification failed'
    });
   }

   if(!results.length){
     return res.status(404).json({
      error:'User not found'
     });
   }

   const secret=
   results[0].mfaSecret;


   const verified=
   speakeasy.totp.verify({
      secret:secret,
      encoding:'base32',
      token:token
   });


   if(!verified){
      return res.status(400).json({
       error:'Invalid OTP'
      });
   }



   db.query(
    `
    UPDATE users
    SET mfaEnabled=1
    WHERE id=?
    `,
    [userId],

    (err2)=>{

      if(err2){
       console.error(err2);

       return res.status(500).json({
         error:'Update failed'
       });
      }

      res.json({
       message:
       'MFA Enabled Successfully'
      });

    }

   );

 });

});



module.exports = router;
