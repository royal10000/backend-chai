import { Schema, model } from "mongoose";

const playlistSchema=new Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        default:"it is one of my playlist"
    },
    videos:{
        type:Schema.Types.ObjectId,
        ref: "Video"
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
})

export const Playlist=model("Playlist",playlistSchema)