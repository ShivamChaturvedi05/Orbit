require('dotenv').config();

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    // Filter to only show models that support text embedding
    const embeddingModels = data.models.filter(m => 
      m.supportedGenerationMethods && m.supportedGenerationMethods.includes('embedContent')
    );
    
    console.log("=== Available Embedding Models for your API Key ===");
    embeddingModels.forEach(m => console.log(m.name));
  } catch (error) {
    console.error('Error fetching models:', error);
  }
}

listModels();
