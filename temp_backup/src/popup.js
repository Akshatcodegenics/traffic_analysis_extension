import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import './styles/simple.css';

// Initialize React app in the popup
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
