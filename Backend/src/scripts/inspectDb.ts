import { connectDatabase, disconnectDatabase } from '../database/mongoose.js'
import { Service, Staff, Customer, ServiceCategory } from '../domains/models.js'
import { Appointment } from '../appointments/model.js'
import { User } from '../auth/User.js'

async function inspect() {
  await connectDatabase()
  const services = await Service.find().select('name categoryId status').lean()
  const staff = await Staff.find().select('displayName designation status').lean()
  const customers = await Customer.find().select('displayName email phone status').lean()
  const appointments = await Appointment.find().lean()
  const users = await User.find().select('loginIdentifier roles customerId').lean()

  console.log('=== SERVICES (' + services.length + ') ===')
  services.forEach((s) => console.log(`- ${s.name} (${s.status})`))

  console.log('\n=== STAFF (' + staff.length + ') ===')
  staff.forEach((st) => console.log(`- ${st.displayName} [${st.designation}] (${st.status})`))

  console.log('\n=== CUSTOMERS (' + customers.length + ') ===')
  customers.forEach((c) => console.log(`- ${c.displayName} (${c.email || c.phone})`))

  console.log('\n=== APPOINTMENTS (' + appointments.length + ') ===')
  appointments.forEach((a) => console.log(`- Appt: ${a.date} ${a.startTime}-${a.endTime} status:${a.status}`))

  console.log('\n=== USERS (' + users.length + ') ===')
  users.forEach((u) => console.log(`- User: ${u.loginIdentifier} roles:${u.roles.join(', ')}`))

  await disconnectDatabase()
}

inspect().catch(console.error)
