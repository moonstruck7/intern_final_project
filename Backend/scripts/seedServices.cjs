const mongoose = require('mongoose');

async function seed() {
  await mongoose.connect('mongodb://localhost:27017/salon_saas');
  const db = mongoose.connection;
  
  const categoriesCollection = db.collection('servicecategories');
  const servicesCollection = db.collection('services');

  const categories = [
    { name: 'Hair Styling', status: 'active' },
    { name: 'Skincare & Facials', status: 'active' },
    { name: 'Nails', status: 'active' },
    { name: 'Spa & Wellness', status: 'active' }
  ];

  const catMap = {};
  for (const cat of categories) {
    let existing = await categoriesCollection.findOne({ name: cat.name });
    if (!existing) {
      const res = await categoriesCollection.insertOne({ ...cat, createdAt: new Date(), updatedAt: new Date() });
      catMap[cat.name] = res.insertedId;
    } else {
      catMap[cat.name] = existing._id;
    }
  }

  const servicesData = [
    {
      name: 'Luxe Signature Haircut',
      category: 'Hair Styling',
      price: 65,
      durationMinutes: 45,
      description: 'Precision cut tailored to your facial contours, finished with botanical wash, blow-dry and styling.',
      imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
      featured: true,
      includedItems: ['Consultation', 'Scalp Massage', 'Blowout Styling']
    },
    {
      name: 'Balayage & Gloss Treatment',
      category: 'Hair Styling',
      price: 160,
      durationMinutes: 120,
      description: 'Hand-painted sun-kissed highlights followed by a conditioning glaze for luminous, dimensional color.',
      imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
      featured: false,
      includedItems: ['Custom Tone Mix', 'Gloss Glaze', 'Bond Protector']
    },
    {
      name: 'Keratin Silk Smoothing',
      category: 'Hair Styling',
      price: 185,
      durationMinutes: 90,
      description: 'Deep anti-frizz keratin protein therapy delivering mirror-smooth shine and humidity resistance for up to 4 months.',
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      featured: false,
      includedItems: ['Deep Clarifying Wash', 'Keratin Infusion', 'Thermal Seal']
    },
    {
      name: 'Hydra-Radiance Facial',
      category: 'Skincare & Facials',
      price: 95,
      durationMinutes: 60,
      description: 'Deep micro-derm hydration with active botanical serums, lymphatic facial massage, and LED glow therapy.',
      imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
      featured: true,
      includedItems: ['Pore Extractions', 'LED Light Therapy', 'Hyaluronic Mask']
    },
    {
      name: 'Deep Cleansing Enzyme Peel',
      category: 'Skincare & Facials',
      price: 80,
      durationMinutes: 50,
      description: 'Purifying enzymatic exfoliation and gentle extraction ritual designed to unclog pores and revitalize tired skin.',
      imageUrl: 'https://images.unsplash.com/photo-1512290903671-1f0233333333?auto=format&fit=crop&w=800&q=80',
      featured: false,
      includedItems: ['Fruit Enzyme Peel', 'Soothing Chamomile Compress', 'SPF Protection']
    },
    {
      name: 'Collagen Firming Therapy',
      category: 'Skincare & Facials',
      price: 120,
      durationMinutes: 75,
      description: 'Firming anti-aging facial utilizing ultrasound infusion and marine collagen sheet mask for youthful elasticity.',
      imageUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80',
      featured: false,
      includedItems: ['Ultrasonic Infusion', 'Marine Collagen Mask', 'Neck & Decolette Care']
    },
    {
      name: 'Deluxe Gel Manicure',
      category: 'Nails',
      price: 45,
      durationMinutes: 45,
      description: 'Cuticle refinement, organic sugar scrub, hand massage, and long-lasting non-chip gel polish curing.',
      imageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80',
      featured: false,
      includedItems: ['Cuticle Care', 'Sugar Scrub', 'Gel LED Curing']
    },
    {
      name: 'Signature Spa Pedicure',
      category: 'Nails',
      price: 55,
      durationMinutes: 50,
      description: 'Aromatic foot soak, callous smoothing, eucalyptus mask with warm towel wrap, and high-shine polish.',
      imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf785179c2ff?auto=format&fit=crop&w=800&q=80',
      featured: false,
      includedItems: ['Eucalyptus Soak', 'Callous Treatment', 'Hot Towel Wrap']
    },
    {
      name: 'Nail Art & Ombré Accents',
      category: 'Nails',
      price: 65,
      durationMinutes: 60,
      description: 'Custom artistic accents, hand-painted minimalist lines, or a seamless French ombre transition on gel overlay.',
      imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80',
      featured: false,
      includedItems: ['Gel Base', 'Hand-painted Art', 'Diamond Topcoat']
    },
    {
      name: 'Aromatherapy Body Massage',
      category: 'Spa & Wellness',
      price: 110,
      durationMinutes: 60,
      description: 'Therapeutic Swedish and pressure point massage with warm lavender and eucalyptus essential oils.',
      imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
      featured: true,
      includedItems: ['Essential Oil Selection', 'Full Body Massage', 'Aromatherapeutic Steam']
    },
    {
      name: 'Hot Stone Herbal Therapy',
      category: 'Spa & Wellness',
      price: 135,
      durationMinutes: 75,
      description: 'Volcanic basalt stones combined with targeted acupressure to stimulate circulation and induce profound serenity.',
      imageUrl: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80',
      featured: false,
      includedItems: ['Heated Basalt Stones', 'Acupressure Relief', 'Herbal Balm']
    },
    {
      name: 'Pink Himalayan Glow Wrap',
      category: 'Spa & Wellness',
      price: 125,
      durationMinutes: 60,
      description: 'Detoxifying pink Himalayan salt exfoliation wrapped in hydrating shea butter and warm thermal blankets.',
      imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80',
      featured: false,
      includedItems: ['Himalayan Salt Scrub', 'Shea Butter Wrap', 'Hydration Mist']
    }
  ];

  for (const s of servicesData) {
    const categoryId = catMap[s.category];
    const updateDoc = {
      name: s.name,
      categoryId,
      price: s.price,
      durationMinutes: s.durationMinutes,
      description: s.description,
      imageUrl: s.imageUrl,
      featured: s.featured,
      includedItems: s.includedItems,
      status: 'active',
      updatedAt: new Date()
    };
    await servicesCollection.updateOne(
      { name: s.name },
      { $set: updateDoc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  }

  console.log(`Successfully seeded ${servicesData.length} services across ${categories.length} categories!`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
