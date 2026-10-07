import { Schema, model } from 'mongoose'
export const appointmentStatuses = ['scheduled','arrived','in_progress','completed','cancelled','no_show'] as const
export const Appointment = model('Appointment', new Schema({
 customerId:{type:Schema.Types.ObjectId,ref:'Customer',required:true,index:true}, serviceId:{type:Schema.Types.ObjectId,ref:'Service',required:true}, staffId:{type:Schema.Types.ObjectId,ref:'Staff',required:true,index:true},
 date:{type:String,required:true,index:true}, startTime:{type:String,required:true}, endTime:{type:String,required:true}, status:{type:String,enum:appointmentStatuses,default:'scheduled',required:true}
},{timestamps:true}).index({staffId:1,date:1,startTime:1}).index({customerId:1,date:1,startTime:1}))
