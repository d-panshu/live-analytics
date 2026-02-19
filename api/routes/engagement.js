const express = require("express");
const crypto = require("crypto");
const authorize = require("../middleware/authorize")
const {producer}= require("../services/kafka");
const { timeStamp } = require("console");
const { json } = require("stream/consumers");

const router = express.Router();

router.post("/like", authorize(["viewer", "admin"]), async(req, res)=>{
      const event={
        eventId:crypto.randomUUID(),
        type:"LIKE",
        streamId: req.body.streamId,
        userId: req.user.id,
        timeStamp:Date.now()
      };
      try{
        await producer.send({
            topic:"engagement-events",
            acks:-1,
            messages:[
                {
                    key:event.streamId,
                    value:JSON.stringify(event)
                }
            ]
        });
        res.status(202).json({status:"event queued"});
      } catch(err){
        res.status(500).json({message:"event ingestion failed"})
      }
  }
);


module.exports = router;