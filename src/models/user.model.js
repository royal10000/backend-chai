import mongoose, { model, Schema } from "mongoose";
import jwt from "jsonwebtoken";
// import {bcrypt} from bcrypt
import bcrypt from "bcrypt"


const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, //cloudinary url 
            required: true
        }, coverImage: {
            type: String, //cloudinary url
        },
        watchHistory: [{
            type: Schema.Types.ObjectId,
            red: "Video"
        }],
        password: {
            type: String,
            required: [true, 'password is required'],
        },
        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
)


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    try {
        this.password = await bcrypt.hash(this.password, 10)
        next()
    } catch (e) {
        console.log("something is error in password hashing or bycrypting : ", err)
    }
})

userSchema.methods.isPasswordCorrect = async function (password) {
    try {
        return await bcrypt.compare(password, this.password)
    } catch (error) {
        console.log("there is some problem in password comparing : ", error);
    }
}



userSchema.methods.generateAccessToken = function () {
    try {
        return jwt.sign(
            {
                _id: this._id,
                email: this.email,
                username: this.username,
                fullname: this.fullname
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY
            }
        )
    } catch (e) {
        console.log("Some error in AccessToken : ", e)
    }
}


userSchema.methods.generateRefreshToken = function () {
    try {
        return jwt.sign(
            {
                _id: this._id,
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            }
        )

    } catch (error) {
        console.log("Some error in RefreshToken : ", error)
    }
}



export const User = model("User", userSchema)