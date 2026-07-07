import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar.js";
import { ProtectedRoute } from "./components/ProtectedRoute.js";
import { LoginPage } from "./pages/LoginPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";
import { HomePage } from "./pages/HomePage.js";
import { ProfilePage } from "./pages/ProfilePage.js";
import { EditProfilePage } from "./pages/EditProfilePage.js";

function App() {
  return (
    <div className="min-h-svh bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/me/edit"
          element={
            <ProtectedRoute>
              <EditProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:username"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
