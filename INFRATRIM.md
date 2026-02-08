# InfraTrim — The Full Story

## Prologue: The Problem

Every month, companies open their AWS bill and wince. $4,000. $12,000. $87,000. The number keeps climbing, but nobody knows *why*. The EC2 instances are running. The S3 buckets are filling. The Lambda functions are firing. Somewhere in that haystack of line items, there's waste — oversized instances burning money at 15% CPU utilization, storage sitting in the most expensive tier when nobody's accessed it in months, on-demand pricing for workloads that have been steady for a year.

The problem isn't that optimization is impossible. It's that it's *invisible*. Engineers don't see cost when they write code. Finance doesn't understand infrastructure when they see the bill. The gap between "what we're spending" and "what we should be spending" is a black box.

InfraTrim cracks it open.

---

## Act I: What InfraTrim Is

InfraTrim is an ML-powered AWS cost optimization platform. You upload your AWS Cost Explorer CSV, and a trained Random Forest model analyzes every line item — every EC2 instance, every S3 bucket, every RDS database, every Lambda function. It tells you exactly what's oversized, what's idle, what's on the wrong pricing plan, and what you can do about it.

Then it goes one step further: it generates Terraform infrastructure-as-code configs so you can *apply* those optimizations to your actual AWS account with a single deployment.

**Live at:** [infratrim.com](https://infratrim.com)

---

## Act II: The Architecture

InfraTrim is a two-service system deployed on Railway, talking to each other over HTTPS.

```
┌──────────────────────────────────────────────────────────────┐
│                        RAILWAY CLOUD                         │
│                                                              │
│  ┌─────────────────────┐      ┌──────────────────────────┐  │
│  │   FRONTEND SERVICE  │      │    BACKEND SERVICE        │  │
│  │   (Nginx + React)   │─────▶│    (Gunicorn + Flask)     │  │
│  │                     │ HTTP │                            │  │
│  │   infratrim.com     │◀─────│  /api/analyze             │  │
│  │                     │      │  /api/generate-terraform   │  │
│  │   Static SPA build  │      │  /api/health              │  │
│  │   served by Nginx   │      │                            │  │
│  └─────────────────────┘      │  Random Forest Model       │  │
│                                │  3 Label Encoders          │  │
│                                └──────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
         ▲                                ▲
         │                                │
    Custom Domain                    Internal URL
    (Spaceship DNS)           cloud-cost-optimizer-
                              production.up.railway.app
```

### The Two Halves

**Frontend** — A React 18 single-page application compiled into static files and served by Nginx. One component file (`App.js`), one stylesheet (`index.css`), zero page reloads. The entire UI lives in 624 lines of JavaScript.

**Backend** — A Flask API server running behind Gunicorn with 2 workers. It loads a pre-trained Random Forest model and three label encoders from `.pkl` files at startup. When a CSV arrives, it processes it with pandas, encodes the categorical variables, runs the model, and returns structured recommendations with confidence scores.

They never share a database. The frontend sends a CSV file, the backend returns JSON. Stateless. Clean.

---

## Act III: The Frontend — Inside `App.js`

### 3.1 Design Tokens

The entire visual language is defined in a single object at the top of the file:

```javascript
const t = {
  bg: { primary: '#0b0e18', secondary: '#0e1120', ... surfaceBlue: 'rgba(15,20,42,0.95)' },
  brand: { primary: '#e2e2e2', accent: '#22c55e', ... },
  text: { primary: '#f0f1f5', secondary: '#a1a4b2', muted: '#6b6f82', dimmed: '#4a4e60' },
  border: { subtle: 'rgba(100,140,255,0.08)', medium: 'rgba(100,140,255,0.12)', ... },
  shadow: { card: '...', cardHover: '...', btn: '...', green: '...' },
  radius: { sm: '6px', md: '8px', lg: '12px', xl: '16px', full: '9999px' },
  tr: { fast: 'all 0.15s ease', normal: 'all 0.2s ease', slow: 'all 0.3s ease' },
};
```

Every color, shadow, radius, and transition in the app references this object. Change `t.brand.accent` from green to blue and the entire app follows. No hunting through 50 files. No CSS variables scattered across stylesheets. One source of truth.

The palette is dark navy (`#0b0e18`) with a green accent (`#22c55e`), azure-tinted borders (`rgba(100,140,255,...)`), and blue-shifted card surfaces (`surfaceBlue`). The visual language is inspired by Linear and Vercel — monochrome with surgical color accents.

### 3.2 Seven Screens, One Component

The app is a single React component (`CloudCostOptimizer`) that renders different screens based on a `screen` state variable. No React Router. No page transitions library. Just conditional rendering:

```
screen === 'landing'         → Marketing page
screen === 'login'           → Sign-in form
screen === 'upload'          → CSV upload with drag-and-drop
screen === 'dashboard'       → Metrics, actions, Terraform export
screen === 'recommendations' → ML recommendations list + detail view
screen === 'analysis'        → Charts (pie + area)
screen === 'ami'             → AMI configuration + model reasoning
```

**Why single-file?** Because this is a focused tool, not a sprawling enterprise app. Every screen shares the same design tokens, the same hover logic, the same animation patterns. Splitting into 20 files would add complexity without adding clarity.

### 3.3 The Landing Page

The first thing a visitor sees. Dark background with a subtle 64px grid pattern, azure ambient glow at the top edge, and a hero section that fades in with staggered animations:

- **Pill badge**: "Built for AWS" — positions the product instantly
- **Headline**: "Stop overpaying for AWS infrastructure" — the pain point in 6 words
- **Subtext**: Explains the upload-analyze-optimize flow
- **Two CTAs**: "Get Started" (white, primary) and "Try Demo" (outlined, secondary)
- **Metrics strip**: EC2/S3/RDS coverage, Random Forest model, Terraform export, real-time insights
- **Feature cards**: Cost Analysis, ML Recommendations, Terraform Generation — with hover lift effects

The landing page does NOT use the `InnerAzure` component. It has its own lighter azure treatment — just a top-edge gradient fade and corner vignettes.

### 3.4 The Login

A centered glassmorphism card on the grid background. Email + password form. Any credentials work — this is a demo. The login extracts the username from the email prefix and stores it in state:

```javascript
const handleLogin = (e) => {
  e.preventDefault();
  setUser({ name: loginEmail.split('@')[0], email: loginEmail });
  setScreen('upload');
};
```

No JWT. No sessions. No database. Authentication is mocked because InfraTrim is a prototype demonstrating ML capability, not a production auth system.

### 3.5 The Upload Screen

Drag-and-drop zone powered by native browser events (`onDragOver`, `onDragLeave`, `onDrop`). No external drag library. The zone pulses green when you hover a file over it, and the border shifts from dashed medium to dashed green.

When a file is dropped or selected:
1. A `FormData` object wraps the CSV
2. It's `POST`ed to `/api/analyze`
3. A loading spinner with progress bar animation appears
4. On success, the response populates `csvData` state and the screen flips to dashboard

There's also a "Try with demo data instead" button that loads a hardcoded dataset — no backend required.

### 3.6 Demo Data

The demo dataset is carefully crafted to showcase every feature of the platform:

- **$4,865/mo total spend** across 5 AWS services (EC2, S3, RDS, Lambda, CloudFront)
- **$1,410/mo potential savings** (29% reduction)
- **4 recommendations** with varying severity and confidence:
  - EC2 Right-Sizing: 5 oversized instances, $546/mo savings, 91% confidence
  - S3 Intelligent-Tiering: 12TB infrequent access, $387/mo savings, 94% confidence
  - Reserved Instance Savings: RDS running on-demand for 11 months, $353.60/mo, 88% confidence
  - Unused EBS Volumes: 9 unattached volumes, $123.40/mo savings, 97% confidence
- **6 months of trend data** showing a realistic cost trajectory from $4,120 to $4,865

### 3.7 The Dashboard

Three metric cards at the top: Monthly Spend, Potential Savings (with percentage trend), and Recommendation Count. Each card uses `surfaceBlue` background with azure-tinted borders that brighten on hover.

Below: a full-width green "Export Terraform Config" button that hits the backend's `/api/generate-terraform` endpoint and downloads a `.tf` file.

Below that: three action cards (Recommendations, Cost Analysis, AMI Generator) with animated arrows that slide right on hover.

The `IdeBanner` component sits at the top — a dismissible blue-green gradient banner announcing the upcoming IDE extension and CLI tool.

### 3.8 The InnerAzure Component

Every inner page (dashboard, recommendations, analysis, AMI) shares a layered ambient glow effect:

```javascript
const InnerAzure = () => (
  <>
    {/* Top-down gradient wash */}
    <div style={{ position: 'fixed', inset: 0,
      background: 'linear-gradient(180deg, rgba(20,50,140,0.18) 0%, ... transparent 100%)',
      pointerEvents: 'none', zIndex: 0 }} />
    {/* Center bloom */}
    <div style={{ position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at 50% 0%, rgba(30,60,160,0.12) ...)',
      pointerEvents: 'none', zIndex: 0 }} />
    {/* Left and right edge glows */}
    <div style={{ ... }} />
    {/* Bottom subtle wash */}
    <div style={{ ... }} />
  </>
);
```

Four fixed `div`s with `pointerEvents: 'none'` — they sit behind all content and create a subtle blue atmosphere. The effect is barely noticeable consciously but makes the inner pages feel distinctly different from the landing page. It's the difference between "a dark page" and "a space."

### 3.9 Recommendations

Two views: list and detail.

**List view**: Cards with severity badges (red for high, amber for medium), confidence percentages, savings amounts, and chevrons that fade in on hover. Clicking a card sets `selectedId` and renders the detail view.

**Detail view**: Full recommendation breakdown — icon, type, severity badge, description, savings amount, confidence meter (a thin progress bar), action required block (green-tinted), and a cost comparison grid showing current vs. projected spend.

### 3.10 Analysis Charts

Two Recharts visualizations side by side:

**Cost by Service** — A donut chart (`PieChart` with `innerRadius`). Each AWS service gets a color from `CHART_COLORS`. Labels show service name and dollar amount.

**Monthly Trend** — An `AreaChart` with a green gradient fill beneath the line. 6 data points showing cost trajectory over time. Custom tooltip with glassmorphism styling. Dollar formatting on Y-axis.

### 3.11 AMI Configuration

The AMI page shows recommended EC2 specs based on the analysis: instance type (t3.large), CPU (2 vCPUs), memory (8 GB), storage (gp3 100GB), network (5 Gbps), and estimated cost ($180/mo).

Each row has a blue icon container — matching the border azure tint of the rest of the inner pages.

A "Model Reasoning" card explains *why* the model chose these specs: observed CPU utilization patterns, memory-light workloads, and cost-optimization priority.

An "Export Terraform" button at the bottom generates downloadable IaC.

---

## Act IV: The Backend — Inside `backend.py`

### 4.1 Server Setup

Flask with CORS enabled. Two workers behind Gunicorn with 120-second timeout (enough for large CSV processing):

```python
app = Flask(__name__)
CORS(app, origins=os.environ.get('CORS_ORIGINS', '*').split(','))
```

On startup, the server loads the ML model and three label encoders:
- `cost_optimizer_model.pkl` — The trained Random Forest classifier
- `le_service.pkl` — Encodes AWS service names (EC2, S3, RDS, etc.) to integers
- `le_instance.pkl` — Encodes instance types (t3.large, m5.xlarge, etc.)
- `le_region.pkl` — Encodes AWS regions (us-east-1, eu-west-1, etc.)

### 4.2 The Analysis Pipeline — `/api/analyze`

When a CSV arrives:

**Step 1: Validation**
- Check file exists in request
- Read CSV with pandas
- Verify required columns: `Service`, `Region`, `Cost`

**Step 2: Fill Missing Data**
- If `CPUUtilization` is missing → random 20-80%
- If `MemoryUtilization` is missing → random 20-80%
- If `NetworkIO` is missing → random 10-100
- If `StorageUsed` is missing → random 50-500
- If `RunningHours` is missing → default 730 (full month)
- If `InstanceType` is missing → default `t3.large`

This means InfraTrim works with minimal CSVs (just Service, Region, Cost) while producing better results with richer data.

**Step 3: Encode Categoricals**
```python
df['Service_Encoded'] = df['Service'].apply(
    lambda x: le_service.transform([x])[0] if x in le_service.classes_ else 0
)
```
Unknown services/instances/regions fall back to `0` rather than crashing.

**Step 4: Predict**
```python
features = ['Service_Encoded', 'InstanceType_Encoded', 'Region_Encoded',
           'Cost', 'CPUUtilization', 'MemoryUtilization',
           'NetworkIO', 'StorageUsed', 'RunningHours']
X = df[features]
predictions = model.predict(X)
probabilities = model.predict_proba(X)
```
9 features go in. Each row gets a recommendation label and a confidence score (max probability from the Random Forest's ensemble).

**Step 5: Group and Map**
Predictions are grouped by type. Each type maps to a user-friendly recommendation:

| Model Output | Display Name | Action |
|---|---|---|
| `downsize` | Right-Size Instances | Downsize to appropriate instance types |
| `terminate` | Terminate Unused Resources | Shut down or delete |
| `reserved_instance` | Reserved Instances | Purchase RI |
| `move_to_glacier` | S3 Storage Optimization | Move to Glacier |
| `intelligent_tiering` | S3 Intelligent Tiering | Enable auto-tiering |
| `delete_unused` | Delete Unused Volumes | Snapshot and delete |
| `downgrade_to_gp3` | Optimize EBS Storage | Downgrade to gp3 |
| `upsize` | Upsize Instances | Upgrade instance type |
| `reduce_memory` | Optimize Lambda Memory | Reduce allocation |
| `optimal` | *(skipped)* | Already optimized |

Savings are estimated at 30% of the affected resources' current cost. Severity is `high` if savings exceed 10% of total spend, otherwise `med`.

**Step 6: Response**
```json
{
  "total_cost": 4865.00,
  "total_savings": 1410.00,
  "savings_percentage": 29.0,
  "recommendations": [...],
  "total_rows": 14,
  "services": { "EC2": 1820, "S3": 1290, ... }
}
```

### 4.3 Terraform Generation — `/api/generate-terraform`

Takes the recommendations array and generates valid HCL (HashiCorp Configuration Language) for each type:

- **Right-Size** → `aws_instance` with downsized `instance_type`
- **Reserved Instance** → `aws_instance` with RI tags (purchase via Console)
- **S3 Glacier** → `aws_s3_bucket` + `aws_s3_bucket_lifecycle_configuration` with 30-day Glacier + 90-day Deep Archive transitions
- **Intelligent Tiering** → `aws_s3_bucket_intelligent_tiering_configuration`
- **EBS Optimization** → `aws_ebs_volume` with `type = "gp3"`
- **Lambda** → `aws_lambda_function` + `aws_iam_role` with optimized memory
- **Terminate/Delete** → Comments only (manual verification required)

The generated script includes provider configuration and a summary block with total monthly/annual savings.

---

## Act V: The Styling — Inside `index.css`

122 lines. Not a CSS framework in sight.

### Font
Inter from Google Fonts — weights 300 through 900. The same typeface Linear, Vercel, and Stripe use. Clean, geometric, professional.

### Scrollbar
Custom WebKit scrollbar: 6px wide, dark track (`rgba(11,14,24,0.8)`), subtle thumb. Invisible until you scroll.

### Animations
11 keyframe animations, all CSS-only (no JavaScript animation libraries):

- `fadeIn` / `fadeInUp` / `fadeInDown` — Entrance animations
- `slideUp` — Larger slide distance for hero elements
- `scaleIn` — Scale from 96% for dropdown menus
- `shimmer` — Background position slide for loading states
- `spin` — Continuous rotation for loading spinners
- `progressBar` — Width 0% to 100% for analysis loading
- `dropZonePulse` — Border color pulse for drag-and-drop
- `slideNav` — Navigation entrance from top
- `countUp` — Subtle number entrance

### Responsive Design
Two breakpoints:

**Tablet (768px):** Nav labels hidden (icons only), landing stats go 2-column, features go single-column, metric cards stack, charts stack, AMI grid stacks.

**Phone (480px):** Everything single-column. Recommendation cards go vertical layout. Chevrons hidden. Reduced padding everywhere. Upload zone tightened. Login card padding reduced.

### CSS-Only Hover States
The nav buttons use a CSS class (`.nav-btn:hover`) instead of React `onMouseEnter`/`onMouseLeave`. This prevents React re-renders on every hover, which was causing a flickering glitch in early versions.

---

## Act VI: Deployment

### Docker — Two Images

**Frontend (`Dockerfile.frontend`):**
```
Stage 1: Node 18 Alpine
  → npm install
  → npm run build (with REACT_APP_API_URL injected as build arg)

Stage 2: Nginx Alpine
  → Copy /app/build to Nginx html directory
  → Copy nginx.conf for SPA routing
  → Dynamic port via sed at runtime
```

**Backend (`Dockerfile.backend`):**
```
Python 3.11 Slim
  → pip install dependencies
  → Copy backend.py + all .pkl model files
  → Gunicorn with 2 workers, 120s timeout
```

### Nginx Configuration

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;

    location / {
        try_files $uri $uri/ /index.html;  # SPA fallback
    }

    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";  # Aggressive caching
    }
}
```

The `try_files` directive is critical for SPAs: if someone navigates directly to `/dashboard`, Nginx serves `index.html` instead of returning 404. React's conditional rendering then shows the right screen.

Static assets (JS bundles, CSS) get 1-year cache with `immutable` — they have content hashes in their filenames, so a new deploy means new filenames.

### Railway

Both services deploy from the same GitHub repository. Each push to `main` triggers auto-deploy. Railway detects the Dockerfiles and builds both services independently.

- **Frontend**: Served at `infratrim.com` via custom domain (Spaceship DNS → Railway CNAME)
- **Backend**: Internal Railway URL, referenced by the frontend via `REACT_APP_API_URL` build argument

---

## Act VII: The Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend Framework | React 18.2 | Component model, hooks, ecosystem |
| Charts | Recharts 2.10 | React-native charting, composable |
| Icons | Lucide React 0.263 | Tree-shakeable, consistent, 1000+ icons |
| CSV Parsing | PapaParse 5.4 | Fast, streaming CSV parser |
| Backend Framework | Flask | Lightweight, perfect for API-only servers |
| ML Model | scikit-learn Random Forest | Interpretable, fast inference, good for tabular data |
| Model Serialization | joblib | Efficient Python object serialization |
| Data Processing | pandas + numpy | Industry standard for tabular data |
| WSGI Server | Gunicorn | Production-grade, multi-worker |
| Web Server | Nginx | Static file serving, SPA routing, caching |
| Container | Docker (multi-stage) | Reproducible builds, minimal images |
| Hosting | Railway | Git-push deploys, Docker support, custom domains |
| Domain | Spaceship | DNS management, CNAME to Railway |
| Font | Inter (Google Fonts) | Clean, geometric, professional |

---

## Act VIII: The Data Flow

Here's what happens when a user uploads a CSV, end to end:

```
User drops CSV file on the upload zone
        │
        ▼
Browser creates FormData, POSTs to /api/analyze
        │
        ▼
Flask receives file, pandas reads CSV into DataFrame
        │
        ▼
Missing columns filled with defaults/random values
        │
        ▼
Categorical columns encoded via label encoders
        │
        ▼
9-feature matrix passed to Random Forest model
        │
        ▼
Model returns: prediction label + probability array per row
        │
        ▼
Predictions grouped by type, mapped to friendly names
        │
        ▼
Savings calculated (30% of affected resource cost)
        │
        ▼
JSON response: total_cost, total_savings, recommendations[], services{}
        │
        ▼
React stores response in csvData state
        │
        ▼
Screen flips to 'dashboard'
        │
        ▼
User explores: metrics → recommendations → charts → AMI → Terraform export
        │
        ▼
Terraform export: recommendations POSTed to /api/generate-terraform
        │
        ▼
Flask generates HCL for each recommendation type
        │
        ▼
Browser downloads .tf file
        │
        ▼
User runs: terraform init && terraform apply
```

---

## Act IX: Design Decisions

### Why Single-File Frontend?
624 lines is manageable. The entire UI shares one design token object, one set of state variables, one flow. Splitting it into 20 component files would mean passing tokens as props (or using Context), managing imports, and adding complexity for zero user benefit. The single file *is* the product — open it, scroll through it, understand the whole thing.

### Why Inline Styles?
Three reasons:
1. **Co-location**: The style is right next to the element. No jumping between files.
2. **Design tokens**: `t.bg.surfaceBlue` reads better than `var(--bg-surface-blue)`.
3. **No build step for CSS**: No PostCSS, no Tailwind config, no CSS Modules setup.

The one exception: hover states use CSS classes (`.nav-btn:hover`) to avoid React re-render glitches.

### Why Random Forest?
- **Interpretable**: You can explain why a prediction was made.
- **Fast inference**: Milliseconds per prediction, even on 1000 rows.
- **Good for tabular data**: Categorical + numerical features, no need for neural networks.
- **Probability scores**: `predict_proba` gives natural confidence percentages.
- **No GPU required**: Runs on a $5/month Railway instance.

### Why Flask Instead of FastAPI?
Flask is simpler for 3 endpoints. No async needed — the model inference is CPU-bound and synchronous. FastAPI's type hints and automatic docs are nice but unnecessary for an API this focused.

### Why Not a Database?
InfraTrim is stateless by design. You upload → analyze → download. There's nothing to persist between sessions. Adding a database would mean user accounts, session management, stored analyses, migration scripts — complexity that doesn't serve the core value prop.

When the product evolves to support saved analyses, team dashboards, or scheduled scans, a database becomes necessary. Not today.

### Why Railway?
Docker support, git-push deploys, custom domains, and a free tier for development. No Kubernetes. No Terraform for the infrastructure itself. Push to main, it's live in 90 seconds.

---

## Act X: Future Directions

### The CLI Tool
A command-line tool that developers run in their project directory:

```bash
$ infratrim scan

Scanning 47 source files...

  src/jobs/batch_processor.py
    L23: boto3.client('s3').put_object() in loop
    → Estimated: $0.05/1000 calls × ~50K/day = $75/mo
    → Fix: Batch with put_objects() — saves ~$60/mo

  src/api/handler.py
    L112: Lambda memory set to 3008MB
    → Observed peak: 412MB
    → Fix: Reduce to 512MB — saves ~$45/mo

Total addressable savings: $105/mo ($1,260/yr)
```

This is the real product. Not bill analysis after the damage is done — cost awareness *while writing code*. Shift-left cloud economics.

**Architecture**: AST parser reads source code → identifies AWS SDK calls, resource configurations, container specs → maps them to pricing models → calculates estimated cost → suggests optimizations.

### The IDE Extension
The same analysis, but inline in VS Code. Yellow squiggly underlines on expensive patterns. Hover to see cost estimate. Quick-fix to apply optimization. Think ESLint, but for money.

**Architecture**: Language Server Protocol (LSP) server → communicates with VS Code extension → AST analysis runs on file save → diagnostics pushed to editor.

### The Business Model: Open Core
- **Open source**: CLI parser, AST analysis engine, VS Code extension shell
- **Closed source**: ML model, pattern database, cost estimation API
- **Free tier**: Local analysis, community patterns, basic recommendations
- **Paid tier**: Cloud-connected analysis, team dashboards, CI/CD integration, custom rules, Slack alerts

The CLI is the distribution channel. The model is the moat.

### Multi-Cloud
AWS first (largest market share, most complex pricing). Then:
- **Azure**: ARM templates, Azure Advisor integration
- **GCP**: Deployment Manager, cost tables
- **Multi-cloud**: Unified dashboard showing waste across all providers

---

## Epilogue: The Files

```
cloud-cost-optimizer/
├── src/
│   ├── App.js              # 624 lines — The entire frontend
│   └── index.css           # 122 lines — Animations, responsive, base styles
├── backend.py              # 413 lines — Flask API + ML model
├── package.json            # React 18, Recharts, Lucide, PapaParse
├── Dockerfile.frontend     # Two-stage: Node build → Nginx serve
├── Dockerfile.backend      # Python 3.11 + Gunicorn
├── nginx.conf              # SPA routing + static caching
├── cost_optimizer_model.pkl # Trained Random Forest classifier
├── le_service.pkl          # Service name encoder
├── le_instance.pkl         # Instance type encoder
├── le_region.pkl           # Region encoder
└── requirements.txt        # Python dependencies
```

7 source files. 1,159 lines of code. A trained ML model. Two Docker containers. One domain. One idea: **make cloud waste visible, then make it fixable.**

---

*InfraTrim. Trim the fat. Ship the savings.*
