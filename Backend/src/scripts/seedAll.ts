import { connectDatabase, disconnectDatabase } from '../database/mongoose.js'
import { ensureDefaultServices } from '../domains/seedDefaults.js'
import { Service, Staff, Availability, Customer } from '../domains/models.js'
import { Appointment } from '../appointments/model.js'
import { User } from '../auth/User.js'

async function main() {
  await connectDatabase()
  console.log('Connected to MongoDB. Running full seeder...')
  await ensureDefaultServices()
  const sCount = await Service.countDocuments({ status: 'active' })
  const stCount = await Staff.countDocuments({ status: 'active' })
  const aCount = await Availability.countDocuments({ status: 'active' })
  const cCount = await Customer.countDocuments({ status: 'active' })
  const apptCount = await Appointment.countDocuments()
  const uCount = await User.countDocuments()
  console.log(
    `Seeding complete: ${sCount} services, ${stCount} specialists, ${aCount} availability slots, ${cCount} customers, ${apptCount} appointments, ${uCount} users!`
  )
  await disconnectDatabase()
}

main().catch((err) => {
  console.error('Seeding error:', err)
  process.exit(1)
})
