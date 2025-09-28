import { Lock } from 'lucide-react';

interface AchievementCardProps {
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  multiplier?: number;
  progressLabel?: string;
}

export function AchievementCard({
  title,
  description,
  icon,
  progress,
  maxProgress,
  isUnlocked,
  multiplier,
  progressLabel
}: AchievementCardProps) {
  const progressPercentage = (progress / maxProgress) * 100;
  
  return (
    <div className="relative p-8 rounded-3xl backdrop-blur-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-white/20 shadow-2xl overflow-hidden">
      {/* Background Stars Effect */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-yellow-300 mb-3">{title}</h3>
          <p className="text-gray-300 text-sm leading-relaxed max-w-xs mx-auto">
            {description}
          </p>
        </div>

        {/* Badge Container */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Multiplier Badge */}
            {multiplier && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full z-20">
                x{multiplier}
              </div>
            )}
            
            {/* Main Badge */}
            <div className={`relative w-32 h-32 rounded-2xl border-4 ${
              isUnlocked 
                ? 'border-yellow-400 bg-gradient-to-br from-yellow-400/20 to-orange-500/20' 
                : 'border-gray-500 bg-gradient-to-br from-gray-600/20 to-gray-700/20'
            } flex items-center justify-center shadow-2xl`}>
              
              {/* Dotted Border Effect */}
              <div className="absolute inset-2 border-2 border-dashed border-white/30 rounded-xl"></div>
              
              {/* Icon */}
              <div className="relative z-10">
                {isUnlocked ? (
                  <span className="text-5xl filter drop-shadow-lg">{icon}</span>
                ) : (
                  <div className="text-4xl text-gray-500 relative">
                    <span className="opacity-30">{icon}</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-8 h-8 text-gray-400" />
                    </div>
                  </div>
                )}
              </div>

              {/* Glow Effect for Unlocked */}
              {isUnlocked && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-400/30 to-orange-500/30 blur-xl"></div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="text-center">
          {/* Progress Label */}
          <div className="mb-4">
            <span className="bg-gray-700/80 text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
              {progressLabel || `${progress}/${maxProgress} DAYS`}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative mb-4">
            <div className="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isUnlocked 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                    : 'bg-gradient-to-r from-yellow-600/70 to-orange-600/70'
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            
            {/* Progress Segments */}
            <div className="absolute inset-0 flex">
              {[...Array(maxProgress)].map((_, i) => (
                <div 
                  key={i} 
                  className="flex-1 border-r border-gray-600 last:border-r-0" 
                />
              ))}
            </div>
          </div>

          {/* Unlock Message */}
          <div className="flex items-center justify-center gap-3">
            <p className="text-gray-400 text-sm">
              {isUnlocked 
                ? '🎉 Badge Unlocked!' 
                : `Complete tasks for ${maxProgress - progress} more day${maxProgress - progress !== 1 ? 's' : ''} to unlock this badge`
              }
            </p>
            
            {!isUnlocked && (
              <div className="w-8 h-8 bg-gray-600/50 rounded-full flex items-center justify-center">
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shine Effect for Unlocked */}
      {isUnlocked && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse"></div>
      )}
    </div>
  );
}
