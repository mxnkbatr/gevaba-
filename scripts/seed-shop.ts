import { getCollection } from '../app/lib/mongodb';

async function seed() {
  const products = [
    {
      name: { mn: "Зандан хүж", en: "Sandalwood Incense" },
      description: { 
        mn: "Төвдийн уламжлалт аргаар хийсэн цэвэр зандан хүж.", 
        en: "Pure sandalwood incense made with traditional Tibetan methods." 
      },
      price: 25000,
      images: ["https://images.unsplash.com/photo-1602166549755-947a8a9f0232?q=80&w=1000&auto=format&fit=crop"],
      category: "incense",
      stock: 100,
      isActive: true,
      isFeatured: true,
      type: "physical",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: { mn: "Мөнгөн эрих", en: "Silver Mala" },
      description: { 
        mn: "108 ширхэгтэй мөнгөн чимэглэл бүхий эрих.", 
        en: "108 beads mala with silver ornaments." 
      },
      price: 120000,
      images: ["https://images.unsplash.com/photo-1598970845340-97b70f0322d6?q=80&w=1000&auto=format&fit=crop"],
      category: "mala",
      stock: 15,
      isActive: true,
      isFeatured: true,
      type: "physical",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: { mn: "Гэгээрлийн зам ном", en: "Path to Enlightenment Book" },
      description: { 
        mn: "Гэгээрлийн зам цувралын эхний боть.", 
        en: "First volume of the Path to Enlightenment series." 
      },
      price: 45000,
      images: ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000&auto=format&fit=crop"],
      category: "sutra",
      stock: 50,
      isActive: true,
      isFeatured: false,
      type: "physical",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: { mn: "Бодьсадва баримал", en: "Bodhisattva Statue" },
      description: { 
        mn: "Голоор бүрсэн жижиг хэмжээтэй Бодьсадва баримал.", 
        en: "Small gold-plated Bodhisattva statue." 
      },
      price: 350000,
      images: ["https://images.unsplash.com/photo-1582234372722-50d7ccc30e5a?q=80&w=1000&auto=format&fit=crop"],
      category: "statue",
      stock: 5,
      isActive: true,
      isFeatured: true,
      type: "physical",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  try {
    const collection = await getCollection('shop_products');
    // Clear existing products if needed, or just insert new ones
    // await collection.deleteMany({}); 
    const result = await collection.insertMany(products);
    console.log(`Successfully seeded ${result.insertedCount} products.`);
  } catch (err) {
    console.error('Error seeding shop products:', err);
  } finally {
    process.exit(0);
  }
}

seed();
