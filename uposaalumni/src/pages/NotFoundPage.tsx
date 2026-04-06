import { Link } from 'react-router'
import { Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <p className="text-xl font-medium mb-2">Page Not Found</p>
      <p className="text-base-content/60 mb-6">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/dashboard" className="btn btn-primary">
        <Home className="w-4 h-4" /> Back to Dashboard
      </Link>
    </div>
  )
}
