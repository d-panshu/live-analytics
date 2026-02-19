const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/user.js");


const router = express.Router();

router.post("/register", async(req, res)=>{
    try{
        const hashed = await bcrypt.hash(req.body.password, 10);

        const user = await User.create({
            email:req.body.email,
            password:hashed, 
            role:req.body.role||"viewer"
        });
        res.status(201).json({ message: "User created" });

    }catch(err){
        res.status(400).json({ error: err.message });
    }
})


router.post("/login", async(req, res)=>{
    const user = await User.findOne({email:req.body.email});
    if(!user) return res.status(401).json({message:"invalid credentials"});

    const match = await bcrypt.compare(req.body.password, user.password);
    if(!match) return res.status(401).json({
        message:"invalid credentials"
    })

    const token= jwt.sign(
        {
            id:user._id,
            role:user.role,
            jti:crypto.randomUUID()
        }, 
        process.env.JWT_SECRET,
        {expiresIn:"1h"}
    );

    res.json({token});
});

mod.exports= router;