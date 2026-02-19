const mongoose = require("mongoose");

const streamSchema = new mongoose.Schema({
    streamId:{type:String, unique: true},
    likes:{
        type: Number, default:0
    }
});

module.exports = mongoose.model("stream", streamSchema);