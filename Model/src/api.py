from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, File
import torch
import cv2
import numpy as np
from model import DETR
from utils.setup import get_classes
from typing import List, Dict
import os, requests
<<<<<<< HEAD
# from dotenv import load_dotenv

# load_dotenv()  # reads .env file
=======
from dotenv import load_dotenv

load_dotenv()  # reads .env file
>>>>>>> 55061f5fffa3be41316a11563a193ac1069c183a


app = FastAPI()

<<<<<<< HEAD
origins = [
    "https://sign-detection.vercel.app",  # frontend origin
    # you can add more allowed origins here
]
=======
# origins = [
#     "http://localhost:5173",  # frontend origin
#     # you can add more allowed origins here
# ]

env = os.getenv("ENV", "development")
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

if env == "development":
    origins = [frontend_url]
else:
    # In production (Render), allow the deployed frontend
    origins = [frontend_url]
>>>>>>> 55061f5fffa3be41316a11563a193ac1069c183a

# env = os.getenv("ENV", "development")
# frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

# if env == "development":
#     origins = [frontend_url]
# else:
#     # In production (Render), allow the deployed frontend
#     origins = [frontend_url]


app.add_middleware(
    CORSMiddleware,
<<<<<<< HEAD
    allow_origins=origins,
=======
    allow_origins=origins,  
>>>>>>> 55061f5fffa3be41316a11563a193ac1069c183a
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, etc.
    allow_headers=["*"],  # headers like Content-Type
)

# model = DETR(num_classes=3)
# model.eval()
# model.load_pretrained('pretrained/4426_model.pt')


MODEL_PATH = "pretrained/4426_model.pt"
MODEL_URL = "https://huggingface.co/Mandarwork/sign/resolve/main/4426_model.pt"


# Ensure model directory exists
os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

# Download model file if missing
if not os.path.exists(MODEL_PATH):
    print(f"Model file not found. Downloading from {MODEL_URL} ...")
    response = requests.get(MODEL_URL, stream=True)
    with open(MODEL_PATH, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
    print("Model downloaded successfully.")

# Now load it
model = DETR(num_classes=3)
model.eval()
<<<<<<< HEAD
model.load_pretrained(MODEL_PATH)


=======
# model.load_pretrained('pretrained/4426_model.pt')


MODEL_PATH = "pretrained/4426_model.pt"
MODEL_URL = "https://huggingface.co/Mandarwork/sign/resolve/main/4426_model.pt"


# Ensure model directory exists
os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

# Download model file if missing
if not os.path.exists(MODEL_PATH):
    print(f"Model file not found. Downloading from {MODEL_URL} ...")
    response = requests.get(MODEL_URL, stream=True)
    with open(MODEL_PATH, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
    print("Model downloaded successfully.")

# Now load it
model = DETR(num_classes=3)
model.eval()
model.load_pretrained(MODEL_PATH)



>>>>>>> 55061f5fffa3be41316a11563a193ac1069c183a
CLASSES = get_classes()

# Adjustable inference parameters
SCORE_THRESHOLD = 0.90  # confidence threshold for keeping detections
MAX_DETECTIONS = 5  # safety cap

MEAN = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
STD = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)


def run_inference(frame: np.ndarray) -> List[Dict]:
    """Run model inference on a BGR frame and return filtered detections.

    Returns a list of dicts: {label, score, bbox:[x1,y1,x2,y2]}
    Bboxes are pixel coordinates in the original frame space.
    """
    orig_h, orig_w = frame.shape[:2]

    # Preprocess (resize + normalize like training)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    rgb = cv2.resize(rgb, (224, 224))
    img = torch.tensor(rgb, dtype=torch.float32).permute(2, 0, 1) / 255.0
    img = (img - MEAN) / STD
    img = img.unsqueeze(0)

    with torch.no_grad():
        outputs = model(img)

    logits = outputs["pred_logits"][0]  # (num_queries, num_classes+1)
    boxes = outputs["pred_boxes"][0]  # (num_queries, 4) in cx,cy,w,h normalized

    probs = logits.softmax(-1)
    scores, labels = probs.max(-1)

    detections: List[Dict] = []
    for i in range(scores.shape[0]):
        cls_id = labels[i].item()
        # Skip background / no-object class (DETR usually has an extra one at the end)
        if cls_id >= len(CLASSES):
            continue
        score = scores[i].item()
        if score < SCORE_THRESHOLD:
            continue

        # Convert bbox from normalized cx,cy,w,h -> pixel x1,y1,x2,y2
        cx, cy, w, h = boxes[i].tolist()
        x1 = (cx - w / 2) * orig_w
        y1 = (cy - h / 2) * orig_h
        x2 = (cx + w / 2) * orig_w
        y2 = (cy + h / 2) * orig_h

        # Clamp to image bounds
        x1 = max(0, min(orig_w - 1, x1))
        y1 = max(0, min(orig_h - 1, y1))
        x2 = max(0, min(orig_w - 1, x2))
        y2 = max(0, min(orig_h - 1, y2))

        detections.append(
            {
                "label": CLASSES[cls_id],
                "score": float(score),
                "bbox": [float(x1), float(y1), float(x2), float(y2)],
            }
        )

    # Sort by score desc and cap
    detections.sort(key=lambda d: d["score"], reverse=True)
    if len(detections) > MAX_DETECTIONS:
        detections = detections[:MAX_DETECTIONS]

    return detections


<<<<<<< HEAD
=======

>>>>>>> 55061f5fffa3be41316a11563a193ac1069c183a
@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    """Receive an uploaded frame and return gesture detections.
    If no gestures are confidently detected, returns an empty list instead of a repeated label.
    """
    img_bytes = await file.read()
    npimg = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    if frame is None:
        return {"detections": []}
    detections = run_inference(frame)
    return {"detections": detections}
