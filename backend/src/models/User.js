const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role : { type: String, enum: ['user', 'admin'], default: 'user' },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "PetListing" }],
    isEmailVerified: { type: Boolean, default: false },
    emailOtpHash: { type: String, default: "" },
    emailOtpExpiresAt: { type: Date },
    emailOtpAttempts: { type: Number, default: 0 },


    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);