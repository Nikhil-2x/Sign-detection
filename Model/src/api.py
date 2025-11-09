from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, File
import torch
import cv2
import numpy as np
from model import DETR
from utils.boxes import rescale_bboxes
from utils.setup import get_classes

app = FastAPI()

origins = [
    "http://localhost:5173",  # frontend origin
    # you can add more allowed origins here
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # or ["*"] for all origins
    allow_credentials=True,
    allow_methods=["*"],     # GET, POST, etc.
    allow_headers=["*"],     # headers like Content-Type
)

model = DETR(num_classes=3)
model.eval()
model.load_pretrained('pretrained/4426_model.pt')
CLASSES = get_classes()

def run_inference(frame):
    img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (224,224))
    img = torch.tensor(img, dtype=torch.float32).permute(2,0,1).unsqueeze(0) / 255.0

    with torch.no_grad():
        outputs = model(img)

    logits = outputs['pred_logits'][0]
    boxes = outputs['pred_boxes'][0]

    probs = logits.softmax(-1)
    scores, labels = probs.max(-1)

    results = []
    for i in range(len(scores)):
        cls_id = labels[i].item()

        if cls_id >= len(CLASSES): 
            continue
        
        if scores[i] > 0.8:
            x_center, y_center, w, h = boxes[i]
            results.append({
                "label": CLASSES[labels[i].item()],
                "score": float(scores[i].item()),
                "bbox": [float(x_center), float(y_center), float(w), float(h)]
            })
    return results


# def run_inference(frame):
#     img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#     img = cv2.resize(img, (224,224))
#     img = torch.tensor(img, dtype=torch.float32).permute(2,0,1).unsqueeze(0) / 255.0

#     with torch.no_grad():
#         outputs = model(img)

#     logits = outputs['pred_logits'][0]
#     boxes = outputs['pred_boxes'][0]

#     probs = logits.softmax(-1)
#     scores, labels = probs.max(-1)

#     results = []
#     for i in range(len(scores)):
#         cls_id = labels[i].item()

#         if cls_id >= len(CLASSES):
#             continue

#         # threshold changed
#         if scores[i] < 0.90:
#             continue

#         x_center, y_center, w, h = boxes[i]
#         results.append({
#             "label": CLASSES[labels[i].item()],
#             "score": float(scores[i].item()),
#             "bbox": [float(x_center), float(y_center), float(w), float(h)]
#         })

#     # no detection = send empty list
#     return results



@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    img_bytes = await file.read()
    npimg = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    detections = run_inference(frame)
    return {"detections": detections}
    # return { "success": True,"detections": detections}

