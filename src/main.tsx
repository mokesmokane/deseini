import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { RouterProvider } from 'react-router-dom';
import router from './router';

const container = document.getElementById('app');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);