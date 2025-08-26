# Symptom Tracker

A comprehensive symptom tracking application built with React 19, Vite, and Material-UI.

## Features

- **Symptom Tracking**: Record daily symptoms with custom severity levels
- **Dynamic Fields**: Configure custom questions and data fields
- **Data Analysis**: Visualize symptom patterns with charts and graphs
- **History View**: Complete symptom history with filtering and search
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices
- **Firebase Integration**: Secure authentication and cloud data storage

## Tech Stack

- **React 19** - Latest React with concurrent features
- **Vite** - Fast build tool and development server
- **Material-UI v7** - Modern UI components and theming
- **Firebase** - Authentication and Firestore database
- **Chart.js** - Data visualization and analytics
- **date-fns** - Modern date manipulation

## Installation

```bash
npm install
```

## Development

Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Production Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Testing

Run tests:
```bash
npm test
```

## Deployment

The app is configured for deployment on Netlify with:
- Automatic builds on git push
- Environment variables for Firebase configuration
- Optimized bundle splitting for performance

## Project Structure

```
src/
├── components/          # React components
│   ├── SymptomTracker.jsx    # Main tracking interface
│   ├── SymptomAnalysis.jsx   # Data visualization
│   ├── SymptomTable.jsx      # History view
│   └── DynamicFieldsManager.jsx # Custom field configuration
├── utils/              # Utility functions
├── firebase.js         # Firebase configuration
└── theme.js           # Material-UI theme
```
