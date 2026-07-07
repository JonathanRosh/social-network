import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

export function HomePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 text-center text-gray-500">
      <p>Feed coming soon.</p>
      <Link to={`/profile/${user.username}`} className="mt-2 inline-block text-gray-900 hover:underline">
        View your profile
      </Link>
    </div>
  );
}
