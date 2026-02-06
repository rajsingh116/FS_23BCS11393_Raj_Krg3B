import Dashboard from "./pages/dashboard.jsx";
import Log from "./pages/log.jsx";
import Header from "./components/header.jsx";
import { Routes, Route, Link, BrowserRouter } from "react-router-dom";
import Login from "./pages/login.jsx";
import ProtectedRoute from "./Routes/ProtectedRoutes.jsx";
import DashboardLayout from "./pages/dashboardLayout.jsx";

function App() {
  return (
    <>
      <BrowserRouter>
        <Header title="Dashboard" />
        <main>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboardLayout"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/log"
              element={
                <ProtectedRoute>
                  <Log />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </BrowserRouter>
    </>
  );
}

export default App;
