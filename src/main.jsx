import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import QueryProvider from './contexts/QueryProvider.jsx';
import ToastProvider from './contexts/ToastProvider.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryProvider>
      <ToastProvider />
      <App />
    </QueryProvider>
  </React.StrictMode>,
);
