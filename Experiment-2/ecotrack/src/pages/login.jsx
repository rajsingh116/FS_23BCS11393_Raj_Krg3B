import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { setIsAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    setIsAuthenticated(true);
    navigate("/");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f0fdf4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          padding: "2rem",
          boxShadow: "0 10px 24px rgba(0,0,0,0.1)",
        }}
      >
        {/* Title */}
        <h2
          style={{
            fontSize: "1.9rem",
            fontWeight: "700",
            color: "#065f46",
            textAlign: "center",
            marginBottom: "0.5rem",
          }}
        >
          Welcome Back
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#047857",
            fontSize: "0.95rem",
            marginBottom: "2rem",
          }}
        >
          Sign in to access your EcoTrack dashboard 
        </p>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "0.8rem",
            borderRadius: "10px",
            backgroundColor: "#16a34a",
            color: "white",
            fontWeight: "600",
            fontSize: "1.05rem",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
          onMouseOver={(e) =>
            (e.target.style.backgroundColor = "#15803d")
          }
          onMouseOut={(e) =>
            (e.target.style.backgroundColor = "#16a34a")
          }
        >
          Login
        </button>

        {/* Footer note */}
        <p
          style={{
            marginTop: "1.5rem",
            fontSize: "0.85rem",
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          Secure access • Environment-first tracking 
        </p>
      </div>
    </div>
  );
};

export default Login;
