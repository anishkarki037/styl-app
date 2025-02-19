import React, { useState, useRef, useEffect } from "react";
import * as mobilenet from "@tensorflow-models/mobilenet"; // MobileNet Model
import "@tensorflow/tfjs";
import { Vibrant } from "node-vibrant/browser";
import { ImagePlus } from "lucide-react";
import "./Rate.css";

const Rate = () => {
  const [image, setImage] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [model, setModel] = useState(null);
  const [modelLoaded, setModelLoaded] = useState(false); // Track if model is loaded

  const imgRef = useRef(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await mobilenet.load();
        setModel(loadedModel);
        setModelLoaded(true); // Mark model as loaded
        console.log("✅ MobileNet Model Loaded");
      } catch (err) {
        console.error("❌ Failed to load model:", err);
        setError("Failed to load the model.");
      }
    };
    loadModel();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imgURL = URL.createObjectURL(file);
      setImage(imgURL);
    }
  };

  // Extract colors from clothing
  const extractClothingColors = async (imageSrc) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Color extraction timed out.")),
        5000
      ); // 5 seconds

      Vibrant.from(imageSrc)
        .getPalette()
        .then((palette) => {
          clearTimeout(timeout);
          console.log("🎨 Extracted Palette:", palette);
          const colors = Object.values(palette)
            .filter((swatch) => swatch && typeof swatch.getHex === "function")
            .map((swatch) => swatch.getHex());

          if (colors.length === 0) {
            reject(new Error("No dominant colors detected."));
          } else {
            resolve(colors);
          }
        })
        .catch(reject);
    });
  };

  // Process Image with MobileNet
  const handleProcessImage = async (e) => {
    e.preventDefault();
    if (!image) {
      setError("Please upload an image.");
      return;
    }
    if (!model) {
      setError("Model is still loading, please wait.");
      return;
    }

    setIsLoading(true);
    setError("");
    setFeedback("");

    try {
      const imgElement = imgRef.current;

      // Explicitly ensure image is loaded
      await new Promise((resolve, reject) => {
        if (imgElement.complete) resolve();
        imgElement.onload = resolve;
        imgElement.onerror = reject;
      });

      console.log("📸 Image Loaded, Processing...");

      // Classify Image with MobileNet
      const predictions = await model.classify(imgElement);
      console.log("🔍 Predictions:", predictions);

      // Check if clothing is detected
      const clothingItems = [
        "T-shirt",
        "jeans",
        "sweater",
        "jacket",
        "dress",
        "suit",
        "tie",
        "trousers",
        "skirt",
        "shirt",
        "coat",
      ];

      const detectedClothing = predictions.find((p) =>
        clothingItems.some((c) => p.className.toLowerCase().includes(c))
      );

      if (!detectedClothing) {
        throw new Error("No clothing detected in the image.");
      }

      console.log("👕 Clothing detected:", detectedClothing);

      // Extract clothing colors
      const colors = await extractClothingColors(image);
      console.log("🎨 Dominant Colors:", colors);

      setFeedback(
        `✅ Detected clothing colors: ${colors.join(
          ", "
        )}. Your outfit is analyzed!`
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rate-container">
      <div className="rate-title">STYL</div>

      {!modelLoaded ? (
        <p className="loading-message">🔄 Loading AI Model...</p>
      ) : (
        <>
          <label htmlFor="image-upload" className="file-input-label">
            <div className="image-upload-container">
              {image ? (
                <img
                  src={image}
                  ref={imgRef}
                  alt="Selected"
                  className="preview-image"
                />
              ) : (
                <div className="upload-placeholder">
                  <ImagePlus size={48} />
                  <span>Drop your pic.</span>
                </div>
              )}
            </div>
          </label>

          <form onSubmit={handleProcessImage} className="rate-form">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading || !modelLoaded}
            >
              {isLoading ? "Processing..." : "Submit"}
            </button>
          </form>

          {error && <p className="error-message">{error}</p>}
          {feedback && <p className="feedback-message">{feedback}</p>}
        </>
      )}
    </div>
  );
};

export default Rate;
