import { Badge } from "@/components/ui/badge";

interface FreeAgentBadgeProps {
  team: string;
  className?: string;
}

/**
 * FreeAgentBadge component that displays a badge for free agent players
 * Only shows when player's team is "Free Agents"
 */
export function FreeAgentBadge({ team, className = "" }: FreeAgentBadgeProps) {
  if (team !== "Free Agents") {
    return null;
  }
  
  return (
    <Badge 
      variant="secondary" 
      className={`bg-gray-600 text-white hover:bg-gray-700 ${className}`}
    >
      Free Agent
    </Badge>
  );
}
