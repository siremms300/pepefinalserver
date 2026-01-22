import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Provide name"]
    },
    email: {
        type: String,
        required: [true, "Provide email"],
        unique: true
    },
    password: {
        type: String,
        required: [true, "Provide password"]
    },
    avatar: {
        type: String,
        default: ""
    }, 
    avatar_public_id: {  // Add this field to store Cloudinary public ID
        type: String,
        default: ""
    },
    mobile: {
        type: Number,
        default: null
    }, 
    refresh_token: {
        type: String,
        default: ""
    },
    verify_Email: {
        type: Boolean,
        default: false
    },
    last_login_date: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ["Active", "Inactive", "Suspended"],
        default: "Active"
    },
    address_details: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'
    }], 
    shopping_cart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CartProduct'
    },
    orderHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    forgot_password_otp: {
        type: String,
        default: null
    },
    forgot_password_expiry: {
        type: Date,
        default: null
    },
    role: {
        type: String,
         enum: ['user', 'admin', 'rider'], // Add 'rider'
        default: 'user'
    }
},
{
    timestamps: true
}
);

const User = mongoose.model("User", userSchema);

export default User;


