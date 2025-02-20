import React, { useState, useRef } from "react";
import { ImagePlus } from "lucide-react";
import "./Rate.css";

const Rate = () => {
  const [image, setImage] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleImageChange = (event) => {
    setError(null);
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File size too large. Please select an image under 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessImage = async (event) => {
    event.preventDefault();
    if (!image) {
      setError("Please select an image first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      const file = inputRef.current.files[0];
      formData.append("image", file);

      console.log("Sending request to server...");

      const response = await fetch("http://localhost:5000/process-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Server response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to process image");
      }

      setFeedback({
        engaging: data.engaging_expression, // Directly access engaging_expression
        summary: data.summary, // Directly access summary
      });
    } catch (err) {
      console.error("Processing error:", err);
      setError(err.message || "Error processing image");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rate-container">
      <div className="rate-title">STYL</div>

      <label htmlFor="image-upload" className="file-input-label">
        <div className="image-upload-container">
          {image ? (
            <img src={image} alt="Selected" className="preview-image" />
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
          ref={inputRef}
        />
        <button
          type="submit"
          className="submit-button"
          disabled={!image || isLoading}
        >
          {isLoading ? "Processing..." : "Submit"}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      {/* Feedback with slide-up effect */}
      <div className={`feedback-container ${feedback ? "show" : ""}`}>
        {image && (
          <img
            src={image}
            alt="Selected"
            className="preview-image feedback-image"
          />
        )}

        {feedback && (
          <div className="feedback-text">
            <h2>{feedback.engaging || "No engaging expression"}</h2>
            <p>{feedback.summary || "No summary available"}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rate;
