const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const inputPath = path.join(__dirname, 'database', 'amazon_products.csv');
const outputPath = path.join(__dirname, 'database', 'sample_500.json');

const categories = {
  electronics: { min: 54, max: 83, count: 0, items: [] },
  clothing: { min: 84, max: 122, count: 0, items: [] },
  home: { min: 163, max: 177, count: 0, items: [] },
  toys: { min: 216, max: 270, count: 0, items: [] },
  sports: { min: 198, max: 200, count: 0, items: [] }
};

let totalExtracted = 0;

console.log("Scanning the massive 375MB CSV file... Please wait.");

const stream = fs.createReadStream(inputPath)
  .pipe(csv())
  .on('data', (row) => {
    // If we have 500, destroy stream to save time
    if (totalExtracted >= 500) {
      stream.destroy();
      return;
    }

    const catId = parseInt(row.category_id, 10);
    if (isNaN(catId)) return;

    for (const [name, cat] of Object.entries(categories)) {
      if (catId >= cat.min && catId <= cat.max && cat.count < 100) {
        
        // Skip products without a valid name or price
        const price = parseFloat(row.price);
        if (!row.title || isNaN(price) || price === 0) return;

        const product = {
          name: row.title,
          description: `Highly rated Amazon product with ${row.stars} stars from ${row.reviews} reviews.`,
          price: price,
          category: name.charAt(0).toUpperCase() + name.slice(1),
          imgUrl: row.imgUrl
        };

        cat.items.push(product);
        cat.count++;
        totalExtracted++;
        break; 
      }
    }
  })
  .on('close', () => {
    // Combine all items
    let finalSample = [];
    for (const cat of Object.values(categories)) {
      finalSample = finalSample.concat(cat.items);
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(finalSample, null, 2));
    console.log(`Success! Extracted exactly ${finalSample.length} products to database/sample_500.json`);
    
    for (const [name, cat] of Object.entries(categories)) {
      console.log(`- ${name}: ${cat.count} items`);
    }
  });
