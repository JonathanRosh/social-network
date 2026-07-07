import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-semibold text-gray-900">
          Social Network
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/friends" className="text-gray-700 hover:text-gray-900">
            Friends
          </Link>
          <Link to={`/profile/${user.username}`} className="text-gray-700 hover:text-gray-900">
            {user.displayName}
          </Link>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-900"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
