import { Schema, model } from "mongoose";

const commentSchema=new Schema({
    content:{
        type:String,
        requierd:true
    },
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    },
    user:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
})

export const Comment=model("Comment",commentSchema)