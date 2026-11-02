from app.core.database import engine

try:
    with engine.connect():
        print("SUCCESS")
except Exception as e:
    print("FAILED")
    print(e)