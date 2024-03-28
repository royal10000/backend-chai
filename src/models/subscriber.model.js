import mongoose, { Schema } from "mongoose";

const SubscriptionSchema = new Schema(
    {
        subscriber: { //person who do subscription
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        channel:{ //one who is being subscribe
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    },
    {
        timestamps: true
    })

export const Subscription = mongoose.model("Subscription", SubscriptionSchema)