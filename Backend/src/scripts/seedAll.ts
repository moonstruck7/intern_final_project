import { connectDatabase, disconnectDatabase } from '../database/mongoose.js'
import { ensureDefaultServices } from '../domains/seedDefaults.js'
import { Service, Staff, Availability } from '../domains/models.js'

async function main() {
  await connectDatabase()
  console.log('Connected to MongoDB. Running full seeder...')
  await ensureDefaultServices()
  const sCount = await Service.countDocuments({ status: 'active' })
  const stCount = await Staff.countDocuments({ status: 'active' })
  const aCount = await Availability.countDocuments({ status: 'active' })
  console.log(`Seeding complete: ${sCount} services, ${stCount} specialists, ${aCount} availability slots!`)
  await disconnectDatabase()
}

main().catch((err) => {
  console.error('Seeding error:', err)
  process.exit(1)
})
