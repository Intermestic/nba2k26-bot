import { getTeamLogo } from "@/lib/teamLogos";

interface TeamLogoBadgeProps {
  team: string | null | undefined;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * TeamLogoBadge component that displays the team's logo
 * Only shows for players on NBA teams (not Free Agents)
 */
export function TeamLogoBadge({ team, className = "", size = "md" }: TeamLogoBadgeProps) {
  const logoUrl = getTeamLogo(team);
  
  if (!logoUrl) {
    return null;
  }
  
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10"
  };
  
  return (
    <div 
      className={`${sizeClasses[size]} bg-white rounded-full p-1 shadow-md ${className}`}
      title={team || ""}
    >
      <img
        src={logoUrl}
        alt={`${team} logo`}
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
  );
}
