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

console.log("hello world")
import connectDB from "./db/db.js"
connectDB()