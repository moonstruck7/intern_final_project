import { Router } from 'express'
import { z } from 'zod'
import { resourceRouter } from './resources.js'
import { Attendance, Availability, Customer, Leave, Service, ServiceCategory, ServicePackage, Staff } from '../domains/models.js'
const status=z.enum(['active','inactive']).optional(); const id=z.string().regex(/^[a-f\d]{24}$/i)
export const domainRouter=Router()
domainRouter.use('/customers',resourceRouter(Customer,'customers.manage',z.object({displayName:z.string().trim().min(1),email:z.string().email().optional(),phone:z.string().trim().optional(),status,notes:z.string().trim().optional()}),['displayName','email','phone']))
domainRouter.use('/service-categories',resourceRouter(ServiceCategory,'services.manage',z.object({name:z.string().trim().min(1),status})))
domainRouter.use('/services',resourceRouter(Service,'services.manage',z.object({name:z.string().trim().min(1),categoryId:id,price:z.number().nonnegative(),durationMinutes:z.number().int().positive(),status})))
domainRouter.use('/packages',resourceRouter(ServicePackage,'services.manage',z.object({name:z.string().trim().min(1),serviceIds:z.array(id).optional(),status})))
const time=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/); const date=z.string().date()
domainRouter.use('/staff/availability',resourceRouter(Availability,'staff.manage',z.object({staffId:id,date,startTime:time,endTime:time,status})))
domainRouter.use('/staff',resourceRouter(Staff,'staff.manage',z.object({displayName:z.string().trim().min(1),designation:z.string().trim().optional(),email:z.string().email().optional(),phone:z.string().trim().optional(),status}),['displayName','designation','email']))
domainRouter.use('/attendance',resourceRouter(Attendance,'staff.manage',z.object({staffId:id,date,status:z.enum(['present','absent']),checkIn:time.optional(),checkOut:time.optional()})))
domainRouter.use('/leave',resourceRouter(Leave,'staff.manage',z.object({staffId:id,startDate:date,endDate:date,status:z.enum(['pending','approved','rejected']).optional(),reason:z.string().trim().optional()})))
