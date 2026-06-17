# NextCareers 🚀

[![Development Stage](https://img.shields.io/badge/Status-In%20Development-yellow.svg)](#)
[![Built with TypeScript](https://img.shields.io/badge/TypeScript-97.4%25-blue.svg)](https://www.typescriptlang.org/)
[![Region](https://img.shields.io/badge/Region-Telangana-orange.svg)](https://eapcet.tsche.ac.in/)

**NextCareers** is an organization-driven platform designed and developed to guide and empower **TG EAPCET (formerly TS EAMCET)** students in the Telangana region. Deciding on the right college and engineering branch can be overwhelming; NextCareers simplifies this journey by providing data-driven college predictions, branch mapping, and deep historical cutoff analytics.

> ⚠️ **Current Project Status: In Development** > This project is currently in an active development phase. Features, data schemas, and API contracts are subject to change as we finalize the platform.

---

## 🛠️ System Architecture & Data Flow

NextCareers operates on a decoupled client-server architecture, acting as an intelligent processing engine for raw state counseling data.

### The Logical Flow

```text
 📑 [Official TSCHE PDFs] ──(Data Extraction)──► 🗄️ [JSON Clean Datasets]
                                                          │
                                                    (API Serving)
                                                          ▼
 🖥️ [Interactive Client UI] ◄──(State/Filters)─── ⚙️ [Prediction Engine]
Data Ingestion: Raw, authoritative PDF cutoff lists from the Telangana State Council of Higher Education (TSCHE) are parsed and structured.Dataset Normalization: The information is distilled into optimized JSON objects (colleges.json, branches.json, cutoffs.json) to allow for rapid querying.Prediction Engine (Backend): Serves the processed data and executes filtering algorithms based on student rank, caste category, regional quotas (OU, AU, SVU, UNR), and gender.Client Interface (Frontend): A type-safe responsive web application allows students to dynamically visualize their prospective college choices.📂 Repository StructureThe project is structured as a monorepo containing both the service layers, configuration files, and official data records:Plaintext├── backend/               # Server-side environment, API routing, and matching logic
├── frontend/              # User interface components, responsive styles, and views
├── .gitignore             # Version control exclusion parameters
├── branches.json          # Definitions & mappings for specialized engineering/pharmacy streams
├── colleges.json          # Verified institutional profiles, codes, and location metadata
├── cutoffs.json           # Flattened, high-performance database of rank metrics
├── TGEAPCET_2025_FINALPHASE_LASTRANKS.pdf   # Reference source data for 2025
└── TS-EAMCET-2022-FINAL-PHASE-Cutoff-Ranks.pdf # Reference source data for 2022
Component Breakdownbackend/: Built to efficiently compute college matches without blocking the main event loop.frontend/: Driven heavily by TypeScript (97.4%) and tailored with robust structural CSS to guarantee a seamless mobile and desktop experience for students checking choices on the go.Data Layer (.json): Offloads processing burdens by keeping complex state counseling combinations structured for $O(1)$ to $O(n)$ lookups.🚀 Getting Started (Local Development)PrerequisitesNode.js (v18 or higher recommended)npm or yarnInstallation & ExecutionClone the repository:Bashgit clone [https://github.com/VenkatAsrith/NextCareers.git](https://github.com/VenkatAsrith/NextCareers.git)
cd NextCareers
Spin up the Backend Service:Bashcd backend
npm install
npm run dev
Spin up the Frontend Client:Open a separate terminal window or tab:Bashcd frontend
npm install
npm run dev
🌐 Live DeploymentEnvironmentStatusURLProduction🚧 BuildingComing Soon (Link will be placed here upon deployment)🤝 ContributingAs the platform is in active development, contributions are highly welcome! Feel free to open issues or submit pull requests to help improve the prediction accuracy or interface.Fork the ProjectCreate your Feature Branch (git checkout -b feature/AmazingFeature)Commit your Changes (git commit -m 'Add some AmazingFeature')Push to the Branch (git push origin feature/AmazingFeature)Open a Pull Request👤 AuthorVenkatAsrith - Design & Development - @VenkatAsrithNextCareers is built with 💙 for the aspiring students of Telangana.
