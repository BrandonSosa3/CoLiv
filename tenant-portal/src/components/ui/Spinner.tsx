export function Spinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#667eea]"></div>
    </div>
  )
}

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <Spinner />
        <p className="mt-4 text-[#98989d]">{message}</p>
      </div>
    </div>
  )
}
