from flask import Flask, request, jsonify
from ai_processor import process_image
import os

app = Flask(__name__)

@app.route("/process-image", methods=["POST"])
def process_image_endpoint():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image = request.files["image"]
    image_path = "uploads/" + image.filename
    image.save(image_path)

    try:
        result = process_image(image_path)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        os.remove(image_path)  # Clean up

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)