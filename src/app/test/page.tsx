export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Test Page</h1>
        <p className="text-gray-400">If you see this, basic routing works!</p>
        <p className="text-gray-500 mt-4">
          Timestamp: {new Date().toISOString()}
        </p>
      </div>
    </div>
  )
}
