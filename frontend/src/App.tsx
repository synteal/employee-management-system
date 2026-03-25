import './App.css'

import { Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import ErrorBoundary from './ErrorBoundary';


function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={<h1>Welcome to the Employee Management System</h1>}
        />
      </Routes>
    </ErrorBoundary>
  );
}

export default App
