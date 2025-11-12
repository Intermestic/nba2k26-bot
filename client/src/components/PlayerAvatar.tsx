import { useState } from "react";

interface PlayerAvatarProps {
  name: string;
  photoUrl?: string | null;
  team?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * PlayerAvatar component that displays player photo or initials fallback
 * Generates colored avatar with player initials when photo is unavailable
 */
export function PlayerAvatar({ 
  name, 
  photoUrl, 
  team = "Free Agent",
  size = "md",
  className = "" 
}: PlayerAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  // Extract initials from player name
  const getInitials = (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  
  // Generate consistent color based on player name
  const getAvatarColor = (fullName: string): string => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-red-500",
    ];
    
    // Simple hash function for consistent color
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };
  
  const sizeClasses = {
    sm: "w-12 h-12 text-sm",
    md: "w-16 h-16 text-lg",
    lg: "w-24 h-24 text-2xl"
  };
  
  const shouldShowPlaceholder = !photoUrl || imageError;
  
  if (shouldShowPlaceholder) {
    const initials = getInitials(name);
    const colorClass = getAvatarColor(name);
    
    return (
      <div 
        className={`${sizeClasses[size]} ${colorClass} rounded-full flex items-center justify-center text-white font-bold ${className}`}
        title={name}
      >
        {initials}
      </div>
    );
  }
  
  return (
    <img
      src={photoUrl}
      alt={name}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
}
