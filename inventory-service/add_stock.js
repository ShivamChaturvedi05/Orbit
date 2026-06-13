require('dotenv').config();
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  stockQuantity: Number
}, { strict: false }); // strict: false allows us to update fields freely

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

async function addStock() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('Connected! Updating all 500 products to have 100 stock...');
    
    // The $set operator forces MongoDB to add this field to every document in the database
    const result = await Product.updateMany({}, { $set: { stockQuantity: 100 } });
    
    console.log(`Success! Updated ${result.modifiedCount} products in the database.`);
    process.exit(0);
  } catch (error) {
    console.error('Fatal Error:', error);
    process.exit(1);
  }
}

addStock();
