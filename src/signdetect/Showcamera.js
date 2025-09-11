import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

export default function HandSignDetector() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const [tracking, setTracking] = useState(false);
  const [prediction, setPrediction] = useState("");

  // Send cropped hand image to backend
  const sendToBackend = async (blob) => {
    const formData = new FormData();
    formData.append("file", blob, "hand.png");

    try {
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
    console.log(data);

      if (data.prediction) {
        setPrediction(data.prediction);
      }
    } catch (err) {
      console.error("Backend error:", err);
    }
  };

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results) => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.save();
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(
        results.image,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const hand = results.multiHandLandmarks[0];

        // Draw landmarks
        drawConnectors(ctx, hand, Hands.HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 2,
        });
        drawLandmarks(ctx, hand, { color: "#FF0000", lineWidth: 1 });

        // Find bounding box around hand
        const xCoords = hand.map((pt) => pt.x);
        const yCoords = hand.map((pt) => pt.y);

        const minX = Math.min(...xCoords) * canvasRef.current.width;
        const maxX = Math.max(...xCoords) * canvasRef.current.width;
        const minY = Math.min(...yCoords) * canvasRef.current.height;
        const maxY = Math.max(...yCoords) * canvasRef.current.height;

        const width = maxX - minX;
        const height = maxY - minY;

        if (width > 20 && height > 20) {
          // Extract hand image
          const handImage = ctx.getImageData(minX, minY, width, height);

          // Resize to 28x28 using offscreen canvas
          const offscreen = document.createElement("canvas");
          offscreen.width = 28;
          offscreen.height = 28;
          const octx = offscreen.getContext("2d");
          octx.putImageData(handImage, 0, 0);
          octx.drawImage(offscreen, 0, 0, width, height, 0, 0, 28, 28);

          // Convert to blob
          offscreen.toBlob((blob) => {
            if (blob) sendToBackend(blob);
          }, "image/png");
        }
      }

      ctx.restore();
    });

    if (videoRef.current) {
      cameraRef.current = new Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });
    }
  }, []);

  const startTracking = () => {
    if (cameraRef.current && !tracking) {
      cameraRef.current.start();
      setTracking(true);
    }
  };

  const stopTracking = () => {
    if (cameraRef.current && tracking) {
      cameraRef.current.stop();
      setTracking(false);
    }
  };

  return (
    <div>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} width="640" height="480"></canvas>

      <div style={{ marginTop: "10px" }}>
        {!tracking ? (
          <button onClick={startTracking}>▶ Start</button>
        ) : (
          <button onClick={stopTracking}>⏹ Stop</button>
        )}
      </div>

      {prediction && (
        <h2 style={{ color: "blue", marginTop: "20px" }}>
          ✋ Predicted Sign: {prediction}
        </h2>
      )}
    </div>
  );
}
