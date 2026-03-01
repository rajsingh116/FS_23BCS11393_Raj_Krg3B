import Dashboard from "./pages/Dashboard.jsx";
import Log from "./pages/log.jsx";
import Header from "./components/Header.jsx";
import { Routes, Route, Link, BrowserRouter } from "react-router-dom";
import Login from "./pages/login.jsx";
import ProtectedRoute from "./Routes/ProtectedRoutes.jsx";
import DashboardLayout from "./pages/DashboardLayout.jsx";
import WaterTracker from "./pages/WaterTracker";

function App() {
  return (
    <>
      <BrowserRouter>
        <Header title="EcoTrack" />
        <main>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/DashboardLayout"
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
            <Route
              path="/water"
              element={
                <ProtectedRoute>
                  <WaterTracker />
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
