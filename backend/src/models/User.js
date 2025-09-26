import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  name: { type: String },
  phone:{ type: String, unique: true, sparse: true},
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  userclass: { type: String, enum: ['basic', 'premium'], default: 'basic' },
  
}, { timestamps: true })

const User = mongoose.model('User', UserSchema)
export default User
