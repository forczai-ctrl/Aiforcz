"""Run the AIForcz backend server"""
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))

    print(f"AIForcz API running at http://127.0.0.1:{port}")
    print(f"API docs available at http://127.0.0.1:{port}/docs")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
