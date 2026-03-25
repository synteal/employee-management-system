import "./App.css";

import { Route, Routes } from "react-router-dom";
import ErrorBoundary from "./ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import EmployeeManagement from "./pages/EmployeeManagement";
import Logout from "./pages/Logout";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/logout" element={<Logout />} />

            {/* Protected Routes inside layout with Navbar */}
            <Route
              element={
                <>
                  <Navbar />
                  <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
                    <ProtectedRoute />
                  </main>
                </>
              }
            >
              <Route path="/" element={<Home />} />

              {/* Admin Routes */}
              <Route element={<ProtectedRoute requiredRole="admin" />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/management" element={<EmployeeManagement />} />
              </Route>
            </Route>
          </Routes>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
