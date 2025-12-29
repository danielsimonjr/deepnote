# @deepnote/web

Local web interface for Deepnote notebooks.

## Features

- **Notebook Editor**: Create and edit notebooks with multiple block types
- **Block Types**: Code (Python), SQL, Text (Markdown), Input widgets, Display blocks
- **Dark/Light Theme**: Toggle between themes
- **Real-time Execution**: Execute code via Jupyter kernel

## Getting Started

```bash
# From the repository root
pnpm install
pnpm dev
```

This starts:
- Web frontend at http://localhost:3000
- Backend server at http://localhost:8000

## Block Types

### Code Blocks
- **Code**: Python code with Monaco editor
- **SQL**: SQL queries with database selection

### Text/Display Blocks
- **Text**: Markdown editor with preview
- **Image**: Display images from URL
- **Big Number**: Large metric display
- **Table**: Data table display

### Input Blocks
- **Text Input**: Single/multi-line text
- **Number Input**: Numeric input with min/max/step
- **Checkbox**: Boolean toggle
- **Select**: Dropdown selection
- **Slider**: Range slider
- **Date Input**: Date picker
- **Button**: Click action

## Architecture

```
src/
  components/
    blocks/          # Block type components
    notebook/        # Notebook editor
    sidebar/         # File browser
    toolbar/         # Action buttons
  hooks/             # React hooks
  stores/            # Zustand state stores
  services/          # API services
```

## Tech Stack

- React 18 + TypeScript
- Vite for build
- Zustand for state management
- Monaco Editor for code editing
- TailwindCSS for styling
- React Query for data fetching
