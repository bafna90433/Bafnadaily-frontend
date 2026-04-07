import React from 'react'
import { Link } from 'react-router-dom'

const NotFoundPage: React.FC = () => (
  <div className="text-center py-24 px-4">
    <div className="text-7xl mb-4">😵</div>
    <h1 className="text-3xl font-heading font-bold mb-2">404 — Not Found</h1>
    <p className="text-gray-400 mb-6">This page doesn't exist!</p>
    <Link to="/" className="btn-primary">Go Home</Link>
  </div>
)

export default NotFoundPage
