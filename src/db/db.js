import dotenv from "dotenv"
import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
// import express from "express"

dotenv.config();
// const app = express()

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        // console.log(`mongodb connected !! DB HOST : ${process.env.MONGODB_URI}/${DB_NAME}`)
        // app.on("error", (err) => {
        //     console.log("something is wrong in your database connection")
        // })
    } catch (err) {
        console.log("Mongodb connection failed : ", err)
        process.exit(1)
    }
}


export default connectDB