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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
      <div className="w-full max-w-md bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/30">
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          Welcome Back 👋
        </h2>

        <p className="text-white/80 text-center mb-8">
          Login to continue to your dashboard
        </p>

        <button
          onClick={handleLogin}
          className="w-full py-3 rounded-xl bg-white text-indigo-600 font-semibold text-lg
                     hover:bg-indigo-100 transition duration-300 ease-in-out
                     shadow-lg hover:shadow-xl active:scale-95"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default Login;
