import { createBrowserRouter } from 'react-router-dom';
import { routeGuard } from './guard';

import App from '../App';

const router = createBrowserRouter(
  [
    {
      path: '/credentials',
      element: <App />,
      loader: routeGuard,
    },
  ]
);

export default router;
