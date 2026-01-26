import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Header = ({ title }) => {
  const { setIsAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogOut = () => {
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <header
      style={{
        backgroundColor: "#0f172a",
        color: "white",
        padding: "0.8rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
      {/* App Title */}
      <h1
        style={{
          fontSize: "1.4rem",
          fontWeight: "700",
          letterSpacing: "0.5px",
          margin: 0,
        }}
      >
        {title}
      </h1>

      {/* Navigation */}
      <nav style={{ display: "flex", gap: "1.5rem" }}>
        <Link
          to="/"
          style={{
            color: "#cbd5f5",
            textDecoration: "none",
            fontSize: "0.95rem",
          }}
        >
          Dashboard
        </Link>

        <Link
          to="/log"
          style={{
            color: "#cbd5f5",
            textDecoration: "none",
            fontSize: "0.95rem",
          }}
        >
          Logs
        </Link>
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogOut}
        style={{
          backgroundColor: "#ef4444",
          color: "white",
          border: "none",
          padding: "0.35rem 0.9rem",
          borderRadius: "6px",
          fontSize: "0.85rem",
          fontWeight: "600",
          cursor: "pointer",
        }}
        onMouseOver={(e) =>
          (e.target.style.backgroundColor = "#dc2626")
        }
        onMouseOut={(e) =>
          (e.target.style.backgroundColor = "#ef4444")
        }
      >
        Logout
      </button>
    </header>
  );
};

export default Header;
