import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './contexts/GoogleAuthContext'
import './index.css'
import Layout from './components/Layout.jsx'
import LandingPage from './pages/LandingPage.jsx'
import JournalPage from './pages/JournalPage.jsx'
import ClinicianPage from './pages/ClinicianPage.jsx'
import BuilderPage from './pages/BuilderPage.jsx'
import SkillsPage from './pages/SkillsPage.jsx'

import NotFoundPage from './pages/NotFoundPage.jsx'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID.apps.googleusercontent.com'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "journal", element: <JournalPage /> },
      { path: "clinician", element: <ClinicianPage /> },
      { path: "builder", element: <BuilderPage /> },
      { path: "skills", element: <SkillsPage /> },
      { path: "sheet/:sheetId/journal", element: <JournalPage /> },
      { path: "sheet/:sheetId/clinician", element: <ClinicianPage /> },
      { path: "sheet/:sheetId/builder", element: <BuilderPage /> }
    ]
  }
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
// Trigger Build
