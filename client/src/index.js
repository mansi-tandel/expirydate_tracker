import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ReminderList from './components/ReminderList.jsx';
import ReminderForm from './components/ReminderForm.jsx';
import EditReminder from './components/EditReminder.jsx';
import SearchReminder from './components/SearchReminder.jsx';
import Signup from './components/Signup.jsx';
import Login from './components/Login.jsx';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import RequireAuth from './routes/RequireAuth.jsx';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <RequireAuth><ReminderList /></RequireAuth> },
        { path: 'add-reminder', element: <RequireAuth><ReminderForm /></RequireAuth> },
        { path: 'edit-reminder/:id', element: <RequireAuth><EditReminder /></RequireAuth> },
  { path: 'search-reminder', element: <RequireAuth><SearchReminder /></RequireAuth> },
  { path: 'reminders/:filter', element: <RequireAuth><ReminderList /></RequireAuth> },
        { path: 'login', element: <Login /> },
        { path: 'signup', element: <Signup /> },
        { path: '*', element: <Navigate to="/" replace /> }
      ]
    }
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RouterProvider 
      router={router}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    />
  </React.StrictMode>
);


