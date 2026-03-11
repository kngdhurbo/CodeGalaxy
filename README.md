# CodeGalaxy

Navigate your codebase like a universe. 

CodeGalaxy is an interactive 3D WebGL data visualization tool that renders GitHub repositories as explorable "universes." Files are positioned based on semantic similarity, sized by complexity, and glowing based on their health metrics.

## Features

- **3D Universe View:** Powered by React Three Fiber and InstancedMeshes. Files are rendered as glowing stars (files), grouping around their Solar Systems (directories).
- **AI Architectural Summaries:** Integrated with OpenRouter/OpenAI to generate plain-English summaries of any file's purpose based on its imports and exports.
- **Deep Code Analysis:** Parses files using Tree-sitter to find semantic dependencies, computes Fan-In, Fan-Out, and Cyclomatic Complexity (Cognitive Load).
- **Visual Tech Debt Mapping:** Files with high bug risk or many TODO/FIXME markers pulse in red. Highly depended-upon files scale up based on Blast Radius.
- **Real-time Github Ingestion:** Simply paste a GitHub repository URL into the fluid glassmorphism landing page form.

## Stack

- **Frontend:** React, Vite, React Three Fiber, Tailwind CSS, Lucide Icons.
- **Backend:** Python, FastAPI, SQLAlchemy, Tree-sitter, UMAP-learn, Sentence-Transformers, httpx.
- **Database:** SQLite (local dev), async operations.

## Setup

### 1. Backend
```bash
cd backend
python -m venv venv
# Windows: venv\\Scripts\\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```
Copy `.env.example` to `.env` and fill in:
- `GITHUB_TOKEN`: Your GitHub PAT.
- `OPENROUTER_API_KEY`: (Optional) For AI summaries.
- `OPENAI_API_KEY`: (Optional) Fallback for AI summaries.

Run the backend:
```bash
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to start exploring!

## License
MIT
