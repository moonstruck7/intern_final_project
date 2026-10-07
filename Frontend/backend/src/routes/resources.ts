import { Router } from 'express'
import { isValidObjectId, type Model } from 'mongoose'
import { z } from 'zod'
import { requireAuthentication, requirePermissions } from '../middleware/auth.js'
import type { Permission } from '../auth/roles.js'
import { HttpError } from '../shared/errors.js'

const query = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20), search: z.string().optional(), status: z.enum(['active','inactive']).optional() })
export function resourceRouter(model: Model<any>, permission: Permission, schema: z.ZodObject<any>, searchFields: string[] = ['name']) {
 const router=Router(); router.use(requireAuthentication, requirePermissions(permission));
 router.post('/', async (r,s,n)=>{try{const x=schema.safeParse(r.body);if(!x.success)throw new HttpError(400,'VALIDATION_ERROR','Invalid request.');s.status(201).json({data:await model.create(x.data)})}catch(e){n(e)}})
 router.get('/',async(r,s,n)=>{try{const q=query.parse(r.query);const f:any=q.status?{status:q.status}:{};if(q.search)f.$or=searchFields.map(field=>({[field]:{$regex:q.search,$options:'i'}}));const [data,total]=await Promise.all([model.find(f).sort({_id:-1}).skip((q.page-1)*q.limit).limit(q.limit),model.countDocuments(f)]);s.json({data,pagination:{page:q.page,limit:q.limit,total}})}catch(e){n(e)}})
 router.get('/:id',async(r,s,n)=>{try{if(!isValidObjectId(r.params.id))throw new HttpError(400,'VALIDATION_ERROR','Invalid identifier.');const d=await model.findById(r.params.id);if(!d)throw new HttpError(404,'NOT_FOUND','Resource not found.');s.json({data:d})}catch(e){n(e)}})
 router.patch('/:id',async(r,s,n)=>{try{if(!isValidObjectId(r.params.id))throw new HttpError(400,'VALIDATION_ERROR','Invalid identifier.');const x=schema.partial().safeParse(r.body);if(!x.success)throw new HttpError(400,'VALIDATION_ERROR','Invalid request.');const d=await model.findByIdAndUpdate(r.params.id,x.data,{new:true,runValidators:true});if(!d)throw new HttpError(404,'NOT_FOUND','Resource not found.');s.json({data:d})}catch(e){n(e)}}); return router
}
