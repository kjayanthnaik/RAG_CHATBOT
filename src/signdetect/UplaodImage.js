import React, { useState } from "react";

function UploadImage() {
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState({});

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://localhost:8000/predict", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    console.log(data);
    
    setPrediction(data);
    
    
  };
console.log(prediction);
  return (
    <div>
      <h2>Sign Language Recognition</h2>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        accept="image/*"
      />
      <button onClick={handleUpload}>Upload & Predict</button>
      {prediction &&
      <>
   
      <h3>Prediction: {prediction.prediction},{prediction.prediction_index}</h3>
      </>
      }
    </div>
  );
}

export default UploadImage;
