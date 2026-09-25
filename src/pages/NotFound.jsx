import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-6xl font-bold text-brand-700">404</h1>
      <p className="text-gray-500 mt-2">Page not found</p>
      <Link to="/" className="mt-6 text-brand-600 hover:underline">
        ← Back to home
      </Link>
    </div>
  );
}