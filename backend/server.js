const express = require("express");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");
const { OpenAI } = require("openai");
const { vl } = require("moondream");

const app = express();
const port = 5000;

app.use(cors());

const upload = multer({ dest: "uploads/" });

const model = new vl({
  apiKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlfaWQiOiIzM2UwYzQzYy1kNzg3LTQ4ZDYtYWI0Ny1kMTM4YjM5OTYyOGIiLCJpYXQiOjE3NDAwMzA3NDV9._87u0enzL7ZcpI2mZYmi-k5mOR7vaf8FIurFk5sOrCE", // Replace with actual Moondream API key
});

const openai = new OpenAI({
  apiKey: "878126c9-6656-4ab4-aebc-bb68147ee78f", // Replace with actual KlusterAI API key
  baseURL: "https://api.kluster.ai/v1",
});

app.post("/process-image", upload.single("image"), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  try {
    const image = fs.readFileSync(file.path);
    console.log("Processing image with Moondream...");

    // Query Moondream
    const answer = await model.query({
      image,
      question:
        "Rate and review the outfit according to the person's complexion, body shape, and clothing colors. Rate the outfit cohesion and provide critical suggestions if needed.",
    });

    console.log("Moondream response:", answer.answer);

    // Send response to KlusterAI for summarization & engaging reaction
    console.log("Sending to KlusterAI...");
    const completion = await openai.chat.completions.create({
      model: "klusterai/Meta-Llama-3.1-8B-Instruct-Turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a fashion stylist AI that provides engaging and concise responses.",
        },
        {
          role: "user",
          content: `Here is an outfit review: "${answer.answer}". 
          1. Generate an engaging one-liner reaction (e.g., 'Wow, stunning!' or 'So stylish!'). 
          2. Summarize the review in 2-3 sentences.`,
        },
      ],
    });

    const klusterData = completion.choices[0].message.content.trim();
    console.log("KlusterAI Response:", klusterData);

    // Split response correctly
    const responseParts = klusterData.split("\n\n");
    const engagingExpression = responseParts[0].replace(/^1\./, "").trim();
    const summary = responseParts[1]
      ? responseParts[1].replace(/^2\./, "").trim()
      : "";

    res.json({
      engaging_expression: engagingExpression,
      summary: summary,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Error processing image",
      details: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
