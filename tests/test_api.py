import uuid
from fastapi.testclient import TestClient
import importlib

app_mod = importlib.import_module("src.app")
client = TestClient(app_mod.app)


def random_email():
    return f"test+{uuid.uuid4().hex[:8]}@mergington.edu"


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Expect some known activity keys
    assert "Chess Club" in data


def test_signup_and_remove_flow():
    email = random_email()
    activity = "Chess Club"

    # Signup
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # Verify participant present
    resp = client.get("/activities")
    data = resp.json()
    assert email in data[activity]["participants"]

    # Remove participant
    resp = client.delete(f"/activities/{activity}/participants", params={"email": email})
    assert resp.status_code == 200
    assert "Removed" in resp.json().get("message", "")

    # Verify participant removed
    resp = client.get("/activities")
    data = resp.json()
    assert email not in data[activity]["participants"]


def test_signup_duplicate_fails():
    email = random_email()
    activity = "Chess Club"

    # First signup ok
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200

    # Second signup should fail
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 400

    # Clean up
    client.delete(f"/activities/{activity}/participants", params={"email": email})


def test_remove_nonexistent_participant_returns_404():
    email = random_email()
    activity = "Chess Club"
    resp = client.delete(f"/activities/{activity}/participants", params={"email": email})
    assert resp.status_code == 404
