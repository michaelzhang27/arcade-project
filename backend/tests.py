import uuid

import app  # assumes running `python tests.py` from backend/

def test_set_get_delete():
    store = app.Store()
    cid = str(uuid.uuid4())
    payload = {"prompts": ["alpha", "beta"], "image": "img_base64_alpha"}

    store.set(cid, payload)
    got = store.get(cid)
    assert got is not None, "Expected value after set"
    assert got.get("prompts") == payload["prompts"], "Prompts mismatch"
    assert got.get("image") == payload["image"], "Image mismatch"

    store.delete(cid)
    assert store.get(cid) is None, "Expected None after delete"
    print("PASS: set/get/delete")

def test_commit_then_get():
    store = app.Store()
    cid = str(uuid.uuid4())
    payload = {"prompts": ["gamma", "delta"], "image": "img_base64_gamma"}

    store.set(cid, payload)
    _ = store.commit()

    got = store.get(cid)
    assert got is not None, "Expected committed value to be retrievable"
    assert got.get("prompts") == payload["prompts"], "Committed prompts mismatch"
    assert got.get("image") == payload["image"], "Committed image mismatch"
    print("PASS: commit then get")

def test_overwrite_then_commit():
    store = app.Store()
    cid = str(uuid.uuid4())
    first = {"prompts": ["first"], "image": "img1"}
    second = {"prompts": ["second"], "image": "img2"}

    store.set(cid, first)
    # Overwrite the same creation with a new payload
    store.set(cid, second)

    store.commit()

    got = store.get(cid)
    assert got is not None, "Expected committed value to be retrievable after overwrite"
    assert got.get("prompts") == second["prompts"], "Overwrite prompts mismatch"
    assert got.get("image") == second["image"], "Overwrite image mismatch"
    print("PASS: overwrite then commit")

def main():
    test_set_get_delete()
    test_commit_then_get()
    test_overwrite_then_commit()
    print("\nAll simple tests passed.")

if __name__ == "__main__":
    main() 