import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import './css/style.css';
// import './charts/ChartjsConfig';

// Import pages
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './partials/clients/ClientDetail';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Fitness from './pages/Fitness';
import Habits from './pages/Habits';
import Profile from './pages/Profile';
import Notes from './pages/Notes';
import NoteEditor from './pages/NoteEditor';
import Timeline from './pages/Timeline';
import Bookkeeping from './pages/Bookkeeping';
import BookkeepingStatements from './pages/BookkeepingStatements';
import BookkeepingReceipts from './pages/BookkeepingReceipts';
import BookkeepingReports from './pages/BookkeepingReports';
import Rentals from './pages/Rentals';


// Import auth components
import Login from './components/Login';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const location = useLocation();
  
  useEffect(() => {
    document.querySelector('html').style.scrollBehavior = 'auto'
    window.scroll({ top: 0 })
    document.querySelector('html').style.scrollBehavior = ''
  }, [location.pathname]);

  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/clients" element={
          <ProtectedRoute>
            <Clients />
          </ProtectedRoute>
        } />
        <Route path="/clients/:id" element={
          <ProtectedRoute>
            <ClientDetail />
          </ProtectedRoute>
        } />
        <Route path="/projects" element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        } />
        <Route path="/fitness" element={
          <ProtectedRoute>
            <Fitness />
          </ProtectedRoute>
        } />
        <Route path="/tasks" element={
          <ProtectedRoute>
            <Tasks />
          </ProtectedRoute>
        } />
        <Route path="/habits" element={
          <ProtectedRoute>
            <Habits />
          </ProtectedRoute>
        } />
        <Route path="/notes" element={
          <ProtectedRoute>
            <Notes />
          </ProtectedRoute>
        } />
        <Route path="/notes/:id" element={
          <ProtectedRoute>
            <NoteEditor />
          </ProtectedRoute>
        } />
        <Route path="/timeline" element={
          <ProtectedRoute>
            <Timeline />
          </ProtectedRoute>
        } />
        <Route path="/bookkeeping" element={
          <ProtectedRoute>
            <BookkeepingReports />
          </ProtectedRoute>
        } />
        <Route path="/bookkeeping/transactions" element={
          <ProtectedRoute>
            <Bookkeeping />
          </ProtectedRoute>
        } />
        <Route path="/bookkeeping/statements" element={
          <ProtectedRoute>
            <BookkeepingStatements />
          </ProtectedRoute>
        } />
        <Route path="/bookkeeping/receipts" element={
          <ProtectedRoute>
            <BookkeepingReceipts />
          </ProtectedRoute>
        } />
        <Route path="/bookkeeping/rentals" element={
          <ProtectedRoute>
            <Rentals />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;