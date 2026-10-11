import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { Service, ServiceCategory, Staff, Availability, Customer } from './models.js'
import { Appointment } from '../appointments/model.js'
import { User } from '../auth/User.js'

export const DEFAULT_SERVICES = [
  {
    name: 'Luxe Signature Haircut',
    category: 'Hair Styling',
    price: 65,
    durationMinutes: 45,
    description: 'Precision cut tailored to your facial contours, finished with botanical wash, blow-dry and styling.',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    featured: true,
    includedItems: ['Consultation', 'Scalp Massage', 'Blowout Styling'],
  },
  {
    name: 'Executive Haircut & Styling',
    category: 'Hair Styling',
    price: 65,
    durationMinutes: 45,
    description: 'Signature cut and refined styling with scalp rejuvenation treatment.',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    featured: false,
    includedItems: ['Consultation', 'Scalp Wash', 'Texturizing & Styling'],
  },
  {
    name: 'Balayage & Gloss Treatment',
    category: 'Hair Styling',
    price: 160,
    durationMinutes: 120,
    description: 'Hand-painted sun-kissed highlights followed by a conditioning glaze for luminous, dimensional color.',
    imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
    featured: false,
    includedItems: ['Custom Tone Mix', 'Gloss Glaze', 'Bond Protector'],
  },
  {
    name: 'Keratin Silk Smoothing',
    category: 'Hair Styling',
    price: 185,
    durationMinutes: 90,
    description: 'Deep anti-frizz keratin protein therapy delivering mirror-smooth shine and humidity resistance for up to 4 months.',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    featured: false,
    includedItems: ['Deep Clarifying Wash', 'Keratin Infusion', 'Thermal Seal'],
  },
  {
    name: 'Hydra-Radiance Facial',
    category: 'Skincare & Facials',
    price: 95,
    durationMinutes: 60,
    description: 'Deep micro-derm hydration with active botanical serums, lymphatic facial massage, and LED glow therapy.',
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    featured: true,
    includedItems: ['Pore Extractions', 'LED Light Therapy', 'Hyaluronic Mask'],
  },
  {
    name: 'Deep Cleansing Enzyme Peel',
    category: 'Skincare & Facials',
    price: 80,
    durationMinutes: 50,
    description: 'Purifying enzymatic exfoliation and gentle extraction ritual designed to unclog pores and revitalize tired skin.',
    imageUrl: 'https://images.unsplash.com/photo-1512290903671-1f0233333333?auto=format&fit=crop&w=800&q=80',
    featured: false,
    includedItems: ['Fruit Enzyme Peel', 'Soothing Chamomile Compress', 'SPF Protection'],
  },
  {
    name: 'Collagen Firming Therapy',
    category: 'Skincare & Facials',
    price: 120,
    durationMinutes: 75,
    description: 'Firming anti-aging facial utilizing ultrasound infusion and marine collagen sheet mask for youthful elasticity.',
    imageUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80',
    featured: false,
    includedItems: ['Ultrasonic Infusion', 'Marine Collagen Mask', 'Neck & Decolette Care'],
  },
  {
    name: 'Deluxe Gel Manicure',
    category: 'Nails',
    price: 45,
    durationMinutes: 45,
    description: 'Cuticle refinement, organic sugar scrub, hand massage, and long-lasting non-chip gel polish curing.',
    imageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80',
    featured: false,
    includedItems: ['Cuticle Care', 'Sugar Scrub', 'Gel LED Curing'],
  },
  {
    name: 'Signature Spa Pedicure',
    category: 'Nails',
    price: 55,
    durationMinutes: 50,
    description: 'Aromatic foot soak, callous smoothing, eucalyptus mask with warm towel wrap, and high-shine polish.',
    imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf785179c2ff?auto=format&fit=crop&w=800&q=80',
    featured: false,
    includedItems: ['Eucalyptus Soak', 'Callous Treatment', 'Hot Towel Wrap'],
  },
  {
    name: 'Nail Art & Ombré Accents',
    category: 'Nails',
    price: 65,
    durationMinutes: 60,
    description: 'Custom artistic accents, hand-painted minimalist lines, or a seamless French ombre transition on gel overlay.',
    imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80',
    featured: false,
    includedItems: ['Gel Base', 'Hand-painted Art', 'Diamond Topcoat'],
  },
  {
    name: 'Aromatherapy Body Massage',
    category: 'Spa & Wellness',
    price: 110,
    durationMinutes: 60,
    description: 'Therapeutic Swedish and pressure point massage with warm lavender and eucalyptus essential oils.',
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
    featured: true,
    includedItems: ['Essential Oil Selection', 'Full Body Massage', 'Aromatherapeutic Steam'],
  },
  {
    name: 'Hot Stone Herbal Therapy',
    category: 'Spa & Wellness',
    price: 135,
    durationMinutes: 75,
    description: 'Volcanic basalt stones combined with targeted acupressure to stimulate circulation and induce profound serenity.',
    imageUrl: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80',
    featured: false,
    includedItems: ['Heated Basalt Stones', 'Acupressure Relief', 'Herbal Balm'],
  },
  {
    name: 'Pink Himalayan Glow Wrap',
    category: 'Spa & Wellness',
    price: 125,
    durationMinutes: 60,
    description: 'Detoxifying pink Himalayan salt exfoliation wrapped in hydrating shea butter and warm thermal blankets.',
    imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80',
    featured: false,
    includedItems: ['Himalayan Salt Scrub', 'Shea Butter Wrap', 'Hydration Mist'],
  },
]

export const DEFAULT_SPECIALISTS = [
  {
    displayName: 'Aanya Sharma',
    designation: 'Senior Hair Stylist',
    bio: '8+ years in precision cuts, contour styling, and balayage. Trained at L\'Oréal Paris Academy.',
    phone: '+91 9800001111',
    email: 'aanya.sharma@salon.com',
    keywords: ['haircut', 'cut', 'style', 'blowout', 'styling'],
  },
  {
    displayName: 'Vikram Malhotra',
    designation: 'Executive Barber & Stylist',
    bio: 'Specialist in modern fades, executive men\'s styling, and scalp revitalization.',
    phone: '+91 9800001122',
    email: 'vikram.malhotra@salon.com',
    keywords: ['executive', 'haircut', 'barber', 'hair', 'styling', 'wash'],
  },
  {
    displayName: 'Priya Mehta',
    designation: 'Master Colorist',
    bio: 'Certified Wella master colorist specializing in balayage, gloss treatments, and highlights.',
    phone: '+91 9800002222',
    email: 'priya.mehta@salon.com',
    keywords: ['balayage', 'color', 'gloss', 'highlight', 'tone', 'hair'],
  },
  {
    displayName: 'Ritu Gupta',
    designation: 'Keratin & Hair Treatment Specialist',
    bio: 'Expert in smoothing, keratin silk therapies, botox hair treatments, and deep conditioning.',
    phone: '+91 9800007777',
    email: 'ritu.gupta@salon.com',
    keywords: ['keratin', 'smoothing', 'treatment', 'silk', 'hair', 'conditioning'],
  },
  {
    displayName: 'Kavya Nair',
    designation: 'Licensed Aesthetician & Facialist',
    bio: 'CIDESCO certified aesthetician specializing in Hydra-Radiance and advanced enzyme peels.',
    phone: '+91 9800003333',
    email: 'kavya.nair@salon.com',
    keywords: ['facial', 'hydra', 'enzyme', 'peel', 'skin', 'skincare'],
  },
  {
    displayName: 'Dr. Meera Sen',
    designation: 'Clinical Skincare Specialist',
    bio: 'Dermatology-certified skin therapist specializing in collagen firming and anti-aging care.',
    phone: '+91 9800003344',
    email: 'meera.sen@salon.com',
    keywords: ['collagen', 'firming', 'therapy', 'skincare', 'facial', 'skin'],
  },
  {
    displayName: 'Divya Reddy',
    designation: 'Senior Nail Artist',
    bio: 'Master in gel overlays, French ombré, and custom intricate hand-painted nail designs.',
    phone: '+91 9800004444',
    email: 'divya.reddy@salon.com',
    keywords: ['nail', 'art', 'ombré', 'gel', 'manicure'],
  },
  {
    displayName: 'Tanya Bose',
    designation: 'Deluxe Manicure & Pedicure Technician',
    bio: 'Specialist in organic spa pedicures, cuticle therapy, and relaxing hand/foot care.',
    phone: '+91 9800004455',
    email: 'tanya.bose@salon.com',
    keywords: ['pedicure', 'manicure', 'spa', 'foot', 'hand', 'gel', 'nail'],
  },
  {
    displayName: 'Pooja Singh',
    designation: 'Certified Massage Therapist',
    bio: 'Specializes in Balinese aromatherapy, deep pressure points, and herbal steam rituals.',
    phone: '+91 9800006666',
    email: 'pooja.singh@salon.com',
    keywords: ['aromatherapy', 'massage', 'balinese', 'spa', 'body', 'steam'],
  },
  {
    displayName: 'Arjun Das',
    designation: 'Holistic Spa & Body Wellness Expert',
    bio: 'Expert in volcanic hot stone therapy, pink Himalayan salt wraps, and muscular rejuvenation.',
    phone: '+91 9800006677',
    email: 'arjun.das@salon.com',
    keywords: ['stone', 'hot stone', 'himalayan', 'wrap', 'scrub', 'body', 'massage', 'spa'],
  },
  {
    displayName: 'Sneha Pillai',
    designation: 'Celebrity Makeup & Bridal Stylist',
    bio: 'Airbrush makeup artist specializing in HD bridal makeovers and red-carpet glam.',
    phone: '+91 9800005555',
    email: 'sneha.pillai@salon.com',
    keywords: ['makeup', 'bridal', 'glam', 'makeover', 'styling', 'party', 'hair'],
  },
]

export const DEFAULT_CUSTOMERS = [
  { displayName: 'Jane Doe', email: 'customer@example.com', phone: '+91 9876543210', notes: 'Prefers botanical products' },
  { displayName: 'Emma Stone', email: 'emma@example.com', phone: '+91 9876543211', notes: 'Hydra-radiance regular' },
  { displayName: 'Aarav Mehta', email: 'aarav.mehta@example.com', phone: '+91 9876543212', notes: 'Executive haircut regular' },
  { displayName: 'Pooja Verma', email: 'pooja.verma@example.com', phone: '+91 9876543213', notes: 'Gel manicure enthusiast' },
  { displayName: 'Ananya Iyer', email: 'ananya.iyer@example.com', phone: '+91 9876543214', notes: 'Balayage client' },
  { displayName: 'Rohan Deshmukh', email: 'rohan.deshmukh@example.com', phone: '+91 9876543215', notes: 'Weekend spa guest' },
  { displayName: 'Siddharth Roy', email: 'sid.roy@example.com', phone: '+91 9876543216', notes: 'Aromatherapy client' },
  { displayName: 'Karan Singhania', email: 'karan.s@example.com', phone: '+91 9876543217', notes: 'Pedicure & massage guest' },
]

const TIME_SLOTS = [
  { start: '09:00', end: '09:30' },
  { start: '09:30', end: '10:00' },
  { start: '10:00', end: '10:30' },
  { start: '10:30', end: '11:00' },
  { start: '11:00', end: '11:30' },
  { start: '11:30', end: '12:00' },
  { start: '12:00', end: '12:30' },
  { start: '13:00', end: '13:30' },
  { start: '13:30', end: '14:00' },
  { start: '14:00', end: '14:30' },
  { start: '14:30', end: '15:00' },
  { start: '15:00', end: '15:30' },
  { start: '15:30', end: '16:00' },
  { start: '16:00', end: '16:30' },
  { start: '16:30', end: '17:00' },
  { start: '17:00', end: '17:30' },
  { start: '17:30', end: '18:00' },
  { start: '18:00', end: '18:30' },
  { start: '18:30', end: '19:00' },
]

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function offsetDay(days: number): string {
  const target = new Date()
  target.setDate(target.getDate() + days)
  return formatDate(target)
}

let _seedingPromise: Promise<void> | null = null

export async function ensureDefaultServices(): Promise<void> {
  if (mongoose.connection.readyState !== 1) return
  if (_seedingPromise) return _seedingPromise

  _seedingPromise = (async () => {
    try {
      // 1. Ensure categories
      const catMap = new Map<string, any>()
      const uniqueCats = Array.from(new Set(DEFAULT_SERVICES.map((s) => s.category)))

      for (const catName of uniqueCats) {
        let cat: any = await ServiceCategory.findOne({ name: catName })
        if (!cat) {
          cat = await ServiceCategory.create({ name: catName, status: 'active' })
        }
        catMap.set(catName, cat._id)
      }

      // 2. Upsert services
      for (const item of DEFAULT_SERVICES) {
        const catId = catMap.get(item.category)
        await Service.findOneAndUpdate(
          { name: item.name },
          {
            name: item.name,
            categoryId: catId,
            price: item.price,
            durationMinutes: item.durationMinutes,
            description: item.description,
            imageUrl: item.imageUrl,
            featured: item.featured,
            includedItems: item.includedItems,
            status: 'active',
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      }

      const allServices = await Service.find({ status: 'active' }).lean()

      // 3. Upsert specialists and map to services
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = formatDate(today)

      for (const spec of DEFAULT_SPECIALISTS) {
        const matchedIds: any[] = []
        for (const kw of spec.keywords) {
          for (const s of allServices) {
            if (s.name.toLowerCase().includes(kw.toLowerCase()) && !matchedIds.some((id) => String(id) === String(s._id))) {
              matchedIds.push(s._id)
            }
          }
        }

        const serviceIds = matchedIds.length > 0 ? matchedIds : allServices.map((s) => s._id)

        const staffDoc: any = await Staff.findOneAndUpdate(
          { email: spec.email },
          {
            displayName: spec.displayName,
            designation: spec.designation,
            bio: spec.bio,
            phone: spec.phone,
            email: spec.email,
            serviceIds,
            status: 'active',
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )

        // 4. Generate availability for the next 30 days if not already present
        const hasAvailability = await Availability.exists({
          staffId: staffDoc._id,
          date: { $gte: todayStr },
        })

        if (!hasAvailability) {
          const slotsToInsert: any[] = []
          for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
            const slotDate = new Date(today)
            slotDate.setDate(today.getDate() + dayOffset)
            const dateStr = formatDate(slotDate)

            for (const slot of TIME_SLOTS) {
              slotsToInsert.push({
                staffId: staffDoc._id,
                date: dateStr,
                startTime: slot.start,
                endTime: slot.end,
                status: 'active',
              })
            }
          }
          await Availability.insertMany(slotsToInsert, { ordered: false })
        }
      }

      // 5. Ensure sample customers
      const customerMap = new Map<string, any>()
      for (const cust of DEFAULT_CUSTOMERS) {
        const doc: any = await Customer.findOneAndUpdate(
          { email: cust.email },
          {
            displayName: cust.displayName,
            email: cust.email,
            phone: cust.phone,
            notes: cust.notes,
            status: 'active',
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
        customerMap.set(cust.displayName, doc)
      }

      // 6. Ensure default staff and admin user accounts with consistent credentials
      const userSpecs = [
        { loginIdentifier: 'admin@salon.com', password: 'Password@123', roles: ['owner'], customerId: undefined },
        { loginIdentifier: 'manager@salon.com', password: 'Password@123', roles: ['manager'], customerId: undefined },
        { loginIdentifier: 'customer@example.com', password: 'Password@123', roles: ['customer'], customerId: customerMap.get('Jane Doe')?._id },
        { loginIdentifier: 'emma@example.com', password: 'Password@123', roles: ['customer'], customerId: customerMap.get('Emma Stone')?._id },
      ]

      for (const spec of userSpecs) {
        const passwordHash = await bcrypt.hash(spec.password, 12)
        const update: any = {
          loginIdentifier: spec.loginIdentifier,
          passwordHash,
          roles: spec.roles,
          isActive: true,
        }
        if (spec.customerId) update.customerId = spec.customerId

        await User.findOneAndUpdate(
          { loginIdentifier: spec.loginIdentifier },
          update,
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        )
      }

      // 7. Ensure realistic appointments across services and specialists
      const allStaff = await Staff.find({ status: 'active' }).lean()
      const serviceByName = new Map(allServices.map((s) => [s.name, s]))
      const staffByName = new Map(allStaff.map((st) => [st.displayName, st]))

      const appointmentBlueprints = [
        // Today - Queue & Live Activity
        {
          customer: 'Jane Doe',
          service: 'Luxe Signature Haircut',
          specialist: 'Aanya Sharma',
          date: offsetDay(0),
          startTime: '09:30',
          endTime: '10:15',
          status: 'completed',
        },
        {
          customer: 'Emma Stone',
          service: 'Hydra-Radiance Facial',
          specialist: 'Kavya Nair',
          date: offsetDay(0),
          startTime: '10:30',
          endTime: '11:30',
          status: 'in_progress',
        },
        {
          customer: 'Aarav Mehta',
          service: 'Executive Haircut & Styling',
          specialist: 'Vikram Malhotra',
          date: offsetDay(0),
          startTime: '11:30',
          endTime: '12:15',
          status: 'arrived',
        },
        {
          customer: 'Pooja Verma',
          service: 'Deluxe Gel Manicure',
          specialist: 'Divya Reddy',
          date: offsetDay(0),
          startTime: '12:00',
          endTime: '12:45',
          status: 'scheduled',
        },
        {
          customer: 'Ananya Iyer',
          service: 'Balayage & Gloss Treatment',
          specialist: 'Priya Mehta',
          date: offsetDay(0),
          startTime: '14:00',
          endTime: '16:00',
          status: 'scheduled',
        },
        {
          customer: 'Rohan Deshmukh',
          service: 'Hot Stone Herbal Therapy',
          specialist: 'Arjun Das',
          date: offsetDay(0),
          startTime: '15:30',
          endTime: '16:45',
          status: 'scheduled',
        },
        {
          customer: 'Siddharth Roy',
          service: 'Aromatherapy Body Massage',
          specialist: 'Pooja Singh',
          date: offsetDay(0),
          startTime: '17:00',
          endTime: '18:00',
          status: 'scheduled',
        },

        // Upcoming Days
        {
          customer: 'Emma Stone',
          service: 'Keratin Silk Smoothing',
          specialist: 'Ritu Gupta',
          date: offsetDay(1),
          startTime: '10:00',
          endTime: '11:30',
          status: 'scheduled',
        },
        {
          customer: 'Jane Doe',
          service: 'Collagen Firming Therapy',
          specialist: 'Dr. Meera Sen',
          date: offsetDay(1),
          startTime: '11:00',
          endTime: '12:15',
          status: 'scheduled',
        },
        {
          customer: 'Karan Singhania',
          service: 'Signature Spa Pedicure',
          specialist: 'Tanya Bose',
          date: offsetDay(1),
          startTime: '14:00',
          endTime: '14:50',
          status: 'scheduled',
        },
        {
          customer: 'Aarav Mehta',
          service: 'Executive Haircut & Styling',
          specialist: 'Sneha Pillai',
          date: offsetDay(2),
          startTime: '11:00',
          endTime: '11:45',
          status: 'scheduled',
        },
        {
          customer: 'Ananya Iyer',
          service: 'Nail Art & Ombré Accents',
          specialist: 'Divya Reddy',
          date: offsetDay(2),
          startTime: '13:30',
          endTime: '14:30',
          status: 'scheduled',
        },
        {
          customer: 'Pooja Verma',
          service: 'Pink Himalayan Glow Wrap',
          specialist: 'Arjun Das',
          date: offsetDay(3),
          startTime: '10:00',
          endTime: '11:00',
          status: 'scheduled',
        },
        {
          customer: 'Rohan Deshmukh',
          service: 'Deep Cleansing Enzyme Peel',
          specialist: 'Kavya Nair',
          date: offsetDay(3),
          startTime: '15:00',
          endTime: '15:50',
          status: 'scheduled',
        },

        // Past Days (Completed History)
        {
          customer: 'Jane Doe',
          service: 'Luxe Signature Haircut',
          specialist: 'Aanya Sharma',
          date: offsetDay(-1),
          startTime: '10:00',
          endTime: '10:45',
          status: 'completed',
        },
        {
          customer: 'Emma Stone',
          service: 'Aromatherapy Body Massage',
          specialist: 'Pooja Singh',
          date: offsetDay(-1),
          startTime: '14:00',
          endTime: '15:00',
          status: 'completed',
        },
        {
          customer: 'Siddharth Roy',
          service: 'Deluxe Gel Manicure',
          specialist: 'Divya Reddy',
          date: offsetDay(-2),
          startTime: '11:00',
          endTime: '11:45',
          status: 'completed',
        },
        {
          customer: 'Ananya Iyer',
          service: 'Balayage & Gloss Treatment',
          specialist: 'Priya Mehta',
          date: offsetDay(-3),
          startTime: '13:00',
          endTime: '15:00',
          status: 'completed',
        },
      ]

      for (const bp of appointmentBlueprints) {
        const custDoc = customerMap.get(bp.customer)
        const sDoc = serviceByName.get(bp.service)
        const stDoc = staffByName.get(bp.specialist)

        if (!custDoc || !sDoc || !stDoc) continue

        await Appointment.findOneAndUpdate(
          {
            customerId: custDoc._id,
            staffId: stDoc._id,
            date: bp.date,
            startTime: bp.startTime,
          },
          {
            customerId: custDoc._id,
            serviceId: sDoc._id,
            staffId: stDoc._id,
            date: bp.date,
            startTime: bp.startTime,
            endTime: bp.endTime,
            status: bp.status,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      }
    } catch (err) {
      console.error('Failed to ensure default services, specialists, and appointments:', err)
    } finally {
      _seedingPromise = null
    }
  })()

  return _seedingPromise
}
