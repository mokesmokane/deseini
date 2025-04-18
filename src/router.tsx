        import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import ProjectView from './views/ProjectView';
import ChartView from './views/ChartView';
import LandingPage from './components/LandingPage';
import Canvas from './components/Canvas';

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
        element: <ProjectView />
      },
      {
        path: 'projects/:projectId/chart/:chartId',
        element: <ProjectView />
      },
      {
        path: 'projects/:projectId/charts/new',
        element: <ChartView />
      },
      {
        path: 'projects/:projectId/canvas',
        element: <Canvas />
      }
    ]
  }
]);

export default router;
