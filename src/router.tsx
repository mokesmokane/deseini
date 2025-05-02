        import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import ChartView from './views/ChartView';
import LandingPage from './components/landing/LandingPage';
import CanvasView from './views/CanvasView';
import ProtectedRoute from './components/ProtectedRoute';
import MermaidNotepad from './components/landing/MermaidNotepad/MermaidNotepad';

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
        element: <ProtectedRoute><ChartView /></ProtectedRoute>
      },
      {
        path: 'projects/:projectId/charts/new',
        element: <ProtectedRoute><ChartView /></ProtectedRoute>
      },
      {
        path: 'projects/:projectId/canvas',
        element: <ProtectedRoute><CanvasView /></ProtectedRoute>
      },
      {
        path: 'projects-new/:projectId',
        element: <ProtectedRoute><LandingPage /></ProtectedRoute>
      },
      {
        path: 'mermaid-notepad',
        element: <ProtectedRoute><MermaidNotepad /></ProtectedRoute>
      }
    ]
  }
]);

export default router;
