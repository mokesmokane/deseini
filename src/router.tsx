import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import ChartView from './views/ChartView';
import LandingPage from './components/landing/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import MermaidNotepad from './components/landing/MermaidNotepad/MermaidNotepad';
import TestGallery from './pages/TestGallery';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <LandingPage />
      },
      {
        path: 'projects/:projectId',
        element: <ProtectedRoute><LandingPage /></ProtectedRoute>
      },
      {
        path: 'projects/:projectId/chart/:chartId',
        element: <ProtectedRoute><LandingPage /></ProtectedRoute>
      },

      {
        path: 'chartView/:projectId/chart/:chartId',
        element: <ProtectedRoute><ChartView /></ProtectedRoute>
      },
      // {
      //   path: 'projects/:projectId/charts/new',
      //   element: <ProtectedRoute><ChartView /></ProtectedRoute>
      // },
      // {
      //   path: 'projects/:projectId/canvas',
      //   element: <ProtectedRoute><CanvasView /></ProtectedRoute>
      // },
       {
        path: 'projects-new/:projectId',
        element: <ProtectedRoute><LandingPage /></ProtectedRoute>
      },
      {
        path: 'mermaid-notepad',
        element: <ProtectedRoute><MermaidNotepad /></ProtectedRoute>
      },
      {
        path: 'testgallery',
        element: <TestGallery />
      }
    ]
  }
]);

export default router;