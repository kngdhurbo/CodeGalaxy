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

## Deploying to Railway

CodeGalaxy is fully configured to be deployed as a single Monorepo project on [Railway](https://railway.app/).

1. Connect your GitHub repository to a new Railway Project.
2. Railway will ask you what you want to deploy. Select your repository.
3. We need to deploy this repository **twice** (once for the frontend, once for the backend).
4. **Setup the Backend Service:**
   - Go to the new service settings in Railway.
   - Go to **Settings > Build > Root Directory** and enter `/backend`.
   - Go to **Variables** and add your `GITHUB_TOKEN`, `OPENROUTER_API_KEY`, etc.
   - Railway will automatically detect the `/backend/Dockerfile` and deploy the FastAPI ML application.
   - Generate a Domain for this backend service.
5. **Setup the Frontend Service:**
   - Click **+ New** inside your Railway project and select the exact same GitHub repository.
   - Go to **Settings > Build > Root Directory** and enter `/frontend`.
   - Go to **Settings > Variables** and add `VITE_API_URL` pointing to the public domain you generated for your backend service (e.g. `https://my-backend-url.up.railway.app/api`).
   - Railway will automatically detect Vite and deploy your 3D frontend.
   - Generate a Domain for the frontend service to access the live app!

## Local Setup

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
