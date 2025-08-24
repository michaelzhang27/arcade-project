from flask import Flask, request
import requests
import base64
from flask_cors import CORS
from supabase import create_client

# APP INITIALIZATION AND ENVIRONMENT VARIABLES
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
# ENV VARIABLES, SHOULD BE IN .ENV - KEEPING HERE FOR SIMPLICITY
STABILITY_API_KEY = "sk-DwfMuWJGZZ2bejdhM4NquoYYaP0kLeWCCwtVyYOR3MnTc2wM"
STABILITY_ENDPOINT = "https://api.stability.ai/v2beta/stable-image/generate/sd3"
SUPABASE_URL = "https://shwxteofzijkzwrelazl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNod3h0ZW9memlqa3p3cmVsYXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NjY0NjcsImV4cCI6MjA3MTU0MjQ2N30.T6EPxFyNuxjl9rf9_nre9HeuLPQdzYb0XFs6Nr-ftBM"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# STORE CLASS - MAPS CREATION IDS (KEY) to PROMPTS and IMAGES (VALUE)
class Store:
    def __init__(self):
        self.committed_store = {}
        self.cart = {}
        try:
            res = supabase.table("creations").select(
                "creation_id, prompts, image_base64, created_at"
            ).execute()
            rows = res.data
            for row in rows:
                cid = row.get("creation_id")
                if not cid:
                    continue
                self.committed_store[cid] = {
                    "prompts": row.get("prompts"),
                    "image": row.get("image_base64"),
                    "created_at": row.get("created_at"),
                }
        except Exception:
            pass

    def set(self, creation_id, value):
        prompts = value.get("prompts")
        image = value.get("image")
        self.cart[creation_id] = {"prompts": prompts, "image": image}

    def get(self, creation_id):
        if creation_id in self.cart:
            return self.cart[creation_id]
        return self.committed_store.get(creation_id)

    def delete(self, creation_id):
        if creation_id in self.cart:
            del self.cart[creation_id]

    def snapshot(self):
        return self.cart

    def commit(self):
        items = self.cart
        try:
            rows = []
            for creation_id, value in items.items():
                rows.append(
                    {
                        "creation_id": creation_id,
                        "prompts": value.get("prompts"),
                        "image_base64": value.get("image"),
                    }
                )
            inserted = []
            if rows:
                res = supabase.table("creations").upsert(rows, on_conflict="creation_id").execute()
                inserted = res.data
            for row in inserted:
                cid = row.get("creation_id")
                self.committed_store[cid] = {
                    "prompts": row.get("prompts"),
                    "image": row.get("image_base64"),
                    "created_at": row.get("created_at"),
                }
        except Exception:
            return {"error": "Supabase upload failed"}
        self.cart = {}
        return items

    def rollback(self):
        self.cart = {}

store = Store()

@app.post("/store/set")
def api_set():
    data = request.get_json(silent=True)
    creation_id = data.get("creation_id")
    value = data.get("value")
    store.set(creation_id, value)
    return {"ok": True}

@app.get("/store/get")
def api_get():
    data = request.get_json(silent=True)
    creation_id = data.get("creation_id")
    value = store.get(creation_id)
    return {"ok": True, "value": value}

@app.post("/store/delete")
def api_delete():
    data = request.get_json(silent=True)
    creation_id = data.get("creation_id")
    store.delete(creation_id)
    return {"ok": True}

@app.get("/store/cart")
def api_cart():
    return {"ok": True, "items": store.snapshot()}

@app.post("/store/commit")
def api_commit():
    result = store.commit()
    return {"ok": True, "committed": result}

@app.post("/store/rollback")
def api_rollback():
    store.rollback()
    return {"ok": True}

@app.get("/history")
def api_history():
    return {"ok": True, "history": store.committed_store}

# GENERATE ENDPOINT USED FOR IMAGE GENERATION
@app.post("/generate")
def generate():
    payload = request.get_json(silent=True)
    prompt = payload.get("prompt").strip()
    image = payload.get("image")
    headers = {
        "Authorization": f"Bearer {STABILITY_API_KEY}",
        "Accept": "image/*",
    }
    data = {"prompt": prompt, "model": "sd3.5-flash", "output_format": "png"}
    files = {}
    if image:
        image_bytes = base64.b64decode(image)
        data["mode"], data["strength"] = "image-to-image", 0.85
        files["image"] = ("image.png", image_bytes)
    else:
        data["mode"] = "text-to-image"
        files["none"] = ""
    response = requests.post(STABILITY_ENDPOINT, headers=headers, data=data, files=files, timeout=60)
    if response.status_code != 200:
        return {"ok": False, "error": response.text}
    image_base64 = base64.b64encode(response.content).decode("utf-8")
    return {"ok": True, "image": image_base64}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4000, use_reloader=True) 