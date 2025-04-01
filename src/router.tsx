        import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import ProjectView from './views/ProjectView';
import ChartView from './views/ChartView';
import LandingPage from './components/LandingPage';

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
      }
    ]
  }
]);

export default router;
