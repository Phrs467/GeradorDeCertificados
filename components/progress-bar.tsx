interface ProgressBarProps {
  current: number
  total: number
  message: string
}

export default function ProgressBar({ current, total, message }: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          {message}
        </span>
        <span className="text-sm text-gray-500">
          {current} / {total} ({percentage.toFixed(1)}%)
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
} 