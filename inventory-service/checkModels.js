require('dotenv').config();

async function listModels() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    console.log("=== AVAILABLE MODELS ===");
    if (data.models) {
      data.models.forEach(m => console.log(m.name, "-> Supported Methods:", m.supportedGenerationMethods.join(', ')));
    } else {
      console.log("Error fetching models:", data);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();
