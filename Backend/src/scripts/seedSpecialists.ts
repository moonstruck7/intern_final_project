/**
 * Seed script: creates specialists mapped to services and generates
 * rich availability across the next 30 days with multiple time slots.
 *
 * Usage (from Backend/):
 *   npx tsx src/scripts/seedSpecialists.ts
 *
 * Requires: MONGODB_URI, NODE_ENV=development, ALLOW_SEED=true
 */
import { env } from '../config/env.js'
import { connectDatabase, disconnectDatabase } from '../database/mongoose.js'
import { Service, Staff, ServiceCategory, Availability } from '../domains/models.js'

if (env.nodeEnv !== 'development' || process.env.ALLOW_SEED !== 'true') {
  throw new Error('Seeding is disabled. Set NODE_ENV=development and ALLOW_SEED=true.')
}
if (!env.mongodbUri) throw new Error('MONGODB_URI is not configured.')

await connectDatabase()

try {
  // ── 1. Fetch existing services ────────────────────────────────────────────
  const services = await Service.find({ status: 'active' }).lean()
  if (services.length === 0) {
    console.warn('No active services found. Please seed services first.')
    process.exit(1)
  }

  const findService = (keyword: string) =>
    services.find((s: any) =>
      s.name.toLowerCase().includes(keyword.toLowerCase())
    )

  // ── 2. Define specialists with service mappings ───────────────────────────
  // Map specialist names to the service keywords they can handle.
  // Fallback: if a service isn't found, skip that mapping.
  const specialistDefs: Array<{
    displayName: string
    designation: string
    bio: string
    phone: string
    email: string
    serviceKeywords: string[]
  }> = [
    {
      displayName: 'Aanya Sharma',
      designation: 'Senior Hair Stylist',
      bio: '8+ years in precision cuts and balayage. Trained at L\'Oréal Paris Academy.',
      phone: '+91 9800001111',
      email: 'aanya.sharma@salon.com',
      serviceKeywords: ['haircut', 'hair cut', 'trim', 'blow dry', 'blowout', 'blow-dry'],
    },
    {
      displayName: 'Priya Mehta',
      designation: 'Color Specialist',
      bio: 'Expert in balayage, highlights, and creative color. Certified Wella colorist.',
      phone: '+91 9800002222',
      email: 'priya.mehta@salon.com',
      serviceKeywords: ['color', 'colour', 'highlight', 'balayage', 'streak', 'tint'],
    },
    {
      displayName: 'Kavya Nair',
      designation: 'Skin & Facial Expert',
      bio: 'Licensed aesthetician specializing in skin rejuvenation and advanced facials.',
      phone: '+91 9800003333',
      email: 'kavya.nair@salon.com',
      serviceKeywords: ['facial', 'skin', 'cleanup', 'clean-up', 'peel', 'glow'],
    },
    {
      displayName: 'Divya Reddy',
      designation: 'Nail Art Technician',
      bio: 'Certified nail technician with expertise in gel extensions and nail art designs.',
      phone: '+91 9800004444',
      email: 'divya.reddy@salon.com',
      serviceKeywords: ['nail', 'manicure', 'pedicure', 'gel'],
    },
    {
      displayName: 'Sneha Pillai',
      designation: 'Makeup & Bridal Artist',
      bio: 'Award-winning makeup artist specializing in bridal and party looks.',
      phone: '+91 9800005555',
      email: 'sneha.pillai@salon.com',
      serviceKeywords: ['makeup', 'make-up', 'bridal', 'party'],
    },
    {
      displayName: 'Pooja Singh',
      designation: 'Spa & Wellness Therapist',
      bio: 'Certified massage therapist and spa specialist with 6 years of experience.',
      phone: '+91 9800006666',
      email: 'pooja.singh@salon.com',
      serviceKeywords: ['massage', 'spa', 'body', 'wax', 'waxing', 'threading', 'eyebrow'],
    },
    {
      displayName: 'Ritu Gupta',
      designation: 'Hair Treatment Specialist',
      bio: 'Keratin and hair treatment expert. Specializes in smoothing and strengthening treatments.',
      phone: '+91 9800007777',
      email: 'ritu.gupta@salon.com',
      serviceKeywords: ['keratin', 'treatment', 'rebonding', 'straighten', 'smoothing', 'conditioning'],
    },
  ]

  // ── 3. Upsert staff and link services ────────────────────────────────────
  console.log('Creating/updating specialists…')
  const createdStaff: any[] = []

  for (const def of specialistDefs) {
    // Resolve which service IDs this specialist handles
    const resolvedServiceIds: any[] = []
    for (const keyword of def.serviceKeywords) {
      const match = findService(keyword)
      if (match && !resolvedServiceIds.some((id: any) => String(id) === String(match._id))) {
        resolvedServiceIds.push(match._id)
      }
    }

    // If no services matched, link to all services as a fallback generalist
    const serviceIds = resolvedServiceIds.length > 0 ? resolvedServiceIds : services.map((s: any) => s._id)

    const existing = await Staff.findOne({ email: def.email })
    let staff: any
    if (existing) {
      staff = await Staff.findByIdAndUpdate(
        existing._id,
        { ...def, serviceIds, status: 'active' },
        { new: true }
      )
      console.log(`  Updated: ${def.displayName}`)
    } else {
      staff = await Staff.create({ ...def, serviceIds, status: 'active' })
      console.log(`  Created: ${def.displayName}`)
    }
    createdStaff.push(staff)
  }

  // ── 4. Generate availability slots for next 30 days ──────────────────────
  console.log('\nGenerating availability slots…')

  // Time slots: 9 AM – 7 PM with 30-min intervals
  // Each staff gets time slots from their own schedule below
  const schedules: Record<string, Array<{ start: string; end: string }>> = {
    morning: [
      { start: '09:00', end: '09:30' },
      { start: '09:30', end: '10:00' },
      { start: '10:00', end: '10:30' },
      { start: '10:30', end: '11:00' },
      { start: '11:00', end: '11:30' },
      { start: '11:30', end: '12:00' },
    ],
    afternoon: [
      { start: '13:00', end: '13:30' },
      { start: '13:30', end: '14:00' },
      { start: '14:00', end: '14:30' },
      { start: '14:30', end: '15:00' },
      { start: '15:00', end: '15:30' },
      { start: '15:30', end: '16:00' },
    ],
    evening: [
      { start: '16:30', end: '17:00' },
      { start: '17:00', end: '17:30' },
      { start: '17:30', end: '18:00' },
      { start: '18:00', end: '18:30' },
      { start: '18:30', end: '19:00' },
      { start: '19:00', end: '19:30' },
    ],
  }

  // Assign schedule patterns per specialist (rotate through morning/afternoon/evening)
  const staffSchedules = [
    ['morning', 'afternoon'],       // Aanya
    ['morning', 'evening'],         // Priya
    ['afternoon', 'evening'],       // Kavya
    ['morning', 'afternoon', 'evening'], // Divya
    ['morning', 'evening'],         // Sneha
    ['afternoon', 'evening'],       // Pooja
    ['morning', 'afternoon'],       // Ritu
  ]

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let totalSlots = 0
  for (let i = 0; i < createdStaff.length; i++) {
    const staff = createdStaff[i]
    const patterns = staffSchedules[i] || ['morning', 'afternoon']

    // Clear existing future availability for this staff
    const todayStr = formatDate(today)
    await Availability.deleteMany({
      staffId: staff._id,
      date: { $gte: todayStr },
    })

    const docs: any[] = []
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = new Date(today)
      date.setDate(today.getDate() + dayOffset)
      const dayOfWeek = date.getDay() // 0=Sun, 6=Sat

      // Sundays and Saturdays get morning and afternoon slots; weekdays get full patterns
      const activePatterns = (dayOfWeek === 0 || dayOfWeek === 6)
        ? ['morning', 'afternoon']
        : patterns

      const dateStr = formatDate(date)
      for (const pattern of activePatterns) {
        for (const slot of schedules[pattern]) {
          docs.push({
            staffId: staff._id,
            date: dateStr,
            startTime: slot.start,
            endTime: slot.end,
            status: 'active',
          })
        }
      }
    }

    await Availability.insertMany(docs, { ordered: false })
    totalSlots += docs.length
    console.log(`  ${staff.displayName}: ${docs.length} slots created`)
  }

  console.log(`\n✅ Done! ${createdStaff.length} specialists, ${totalSlots} availability slots.`)
} finally {
  await disconnectDatabase()
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
