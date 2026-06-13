require('dotenv').config();
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define Schema locally so the script is standalone
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
  imgUrl: String,
  embedding: [Number]
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const getEmbedding = async (text) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const result = await model.embedContent(text);
  return result.embedding.values;
};

const delay = ms => new Promise(res => setTimeout(res, ms));

async function seed() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected Successfully! Wiping old database...');
    
    // Wipe old data to prevent duplicates!
    await Product.deleteMany({});

    const dataPath = path.join(__dirname, 'database', 'sample_500.json');
    const products = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    console.log(`Loaded ${products.length} products. Starting AI injection...`);

    let successCount = 0;
    
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      try {
        // We embed the name and the CATEGORY to give the AI context!
        const textToEmbed = `Product Name: ${p.name} | Category: ${p.category}`;
        const embedding = await getEmbedding(textToEmbed);

        await Product.create({
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          imgUrl: p.imgUrl,
          embedding: embedding
        });

        successCount++;
        
        // Print progress every 10 items so we don't spam the console
        if (successCount % 10 === 0) {
          console.log(`Progress: ${successCount} / ${products.length} products embedded and saved to Atlas.`);
        }

        // Sleep for 500ms between calls to ensure we don't get blocked by Google's Free Tier Rate Limits
        await delay(500); 

      } catch (err) {
        console.log(`\nNetwork or API error on item ${i} (${err.message}). Sleeping for 5 seconds before retrying...`);
        await delay(5000);
        i--; // Retry this item no matter what the error was
      }
    }

    console.log('\n\nSUCCESS! All 500 products have been embedded and saved to your Cloud Database!');
    process.exit(0);

  } catch (error) {
    console.error('Fatal Error:', error);
    process.exit(1);
  }
}

seed();
