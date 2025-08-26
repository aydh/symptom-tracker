import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import React from 'react';
import App from './App.jsx';
import '@fontsource/lora/400.css';
import '@fontsource/lora/500.css';
import '@fontsource/lora/700.css';

const root = createRoot(document.getElementById('root'));

// More robust error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <h1>Something went wrong</h1>
          <p>Error: {this.state.error?.message}</p>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

// Add global error handlers
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log('Starting app initialization...');

// Simple test component
const TestComponent = () => {
  console.log('TestComponent rendering');
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test Component</h1>
      <p>If you can see this, React is working!</p>
    </div>
  );
};

root.render(
  <StrictMode>
    <ErrorBoundary>
      <TestComponent />
    </ErrorBoundary>
  </StrictMode>
);
