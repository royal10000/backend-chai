// import mongoose from "mongoose";
// import { DB_NAME } from "./constant.js";
// import dotenv from 'dotenv';
// dotenv.config();
// import express from "express";
// const app = express();
// (async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error", (error) => {
//             console.error("unable to connect to your database", DB_NAME)
//             throw error;
//         })
//         app.listen(process.env.PORT, () => {
//             console.log(`app is running on ${process.env.PORT}`)
//         })
//     } catch (error) {
//         console.log("Error : ", error)
//         throw error;
//     }
// })()

// console.log("hello world")
import connectDB from "./db/db.js"
import { app } from './app.js'
connectDB()
.then(()=>{
    // console.log("hel")
    app.on("error",(err)=>{
        console.log("some thing is wrong with your app and db connection : ",err)
    })
    app.listen(process.env.PORT||8000,()=>{
        console.log(`database is connected and launched in port : ${process.env.PORT}`)
    })
}).catch((e)=>{
    console.log("Error handle in index.js page",e )
})