// server.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");
const { vl } = require("moondream");

const app = express();
const port = 5000;

app.use(cors());

const model = new vl({
  apiKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlfaWQiOiIzM2UwYzQzYy1kNzg3LTQ4ZDYtYWI0Ny1kMTM4YjM5OTYyOGIiLCJpYXQiOjE3NDAwMzA3NDV9._87u0enzL7ZcpI2mZYmi-k5mOR7vaf8FIurFk5sOrCE",
}); // Replace with your API key
const upload = multer({ dest: "uploads/" });

app.post("/process-image", upload.single("image"), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  try {
    // Read the uploaded image
    const image = fs.readFileSync(file.path);

    console.log("Processing image with Moondream...");

    // Query the model
    const answer = await model.query({
      image,
      //   question:
      //     "Focus on the subject importantly a person, Describe their body shape. Describe their clothing attitre,differentiate all the different clothing apperals and accessories the person is wearing then, list out all of them along with the precise rgba colors of the items",
      question:
        "Rate and review the outfit according to the person complexion, body shape, and the color of the outfit, clothing items details. think hard and Rate the outfit cohesion and if it is not cohesive and doesnot complement the person be critiacal of the outfit and give suggestions.",
    });

    console.log("Moondream response:", answer);

    // Clean up uploaded file
    fs.unlinkSync(file.path);

    res.json({ caption: answer });
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
