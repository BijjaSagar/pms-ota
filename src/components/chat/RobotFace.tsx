import { cn } from '../../utils/cn'

interface RobotFaceProps {
  className?: string
  talking?: boolean
}

export function RobotFace({ className, talking = false }: RobotFaceProps) {
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center', className)}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="size-full" fill="none">
        <circle
          cx="32"
          cy="7.5"
          r="3"
          fill="currentColor"
          opacity="0.85"
          className="robot-antenna"
        />
        <path
          d="M32 10.5V16"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <rect x="4.5" y="27" width="5" height="13" rx="2.5" fill="currentColor" opacity="0.45" />
        <rect x="54.5" y="27" width="5" height="13" rx="2.5" fill="currentColor" opacity="0.45" />
        <rect
          x="9"
          y="15"
          width="46"
          height="38"
          rx="14"
          fill="currentColor"
          opacity="0.16"
          stroke="currentColor"
          strokeOpacity="0.3"
          strokeWidth="1.4"
        />
        <rect x="15" y="21.5" width="34" height="23" rx="8.5" fill="#10202b" />
        <rect
          x="15.6"
          y="22.1"
          width="32.8"
          height="21.8"
          rx="7.9"
          stroke="#79d8cf"
          strokeOpacity="0.22"
          strokeWidth="1.2"
        />
        <g className="robot-eyes">
          <rect x="22.5" y="28.5" width="5.5" height="8" rx="2.75" fill="#79d8cf" />
          <rect x="36" y="28.5" width="5.5" height="8" rx="2.75" fill="#79d8cf" />
        </g>
        <rect
          x="27"
          y="39"
          width="10"
          height="2.6"
          rx="1.3"
          fill="#79d8cf"
          opacity="0.85"
          className={cn('robot-mouth', talking && 'robot-mouth-talking')}
        />
      </svg>
    </span>
  )
}
