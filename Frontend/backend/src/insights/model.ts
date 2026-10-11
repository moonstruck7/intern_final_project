import { Schema, model } from 'mongoose'
export const Campaign=model('Campaign',new Schema({name:{type:String,required:true},status:{type:String,enum:['draft','active','archived'],default:'draft'},audienceNote:String},{timestamps:true}))
export const Notification=model('Notification',new Schema({recipientUserId:{type:Schema.Types.ObjectId,ref:'User'},title:{type:String,required:true},body:{type:String,required:true},readAt:Date,referenceType:String,referenceId:Schema.Types.ObjectId},{timestamps:true}).index({recipientUserId:1,readAt:1}))
