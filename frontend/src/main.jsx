import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { FleetProvider } from './context/FleetContext';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <FleetProvider interval={3000}>
        <App />
      </FleetProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
