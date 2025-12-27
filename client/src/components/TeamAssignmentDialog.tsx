import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { VALID_TEAMS } from '@/../../server/team-validator';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface TeamAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  selectedPlayerIds: string[];
  players: Array<{ id: string; name: string; team?: string | null }>;
  onSuccess: () => void;
}

const TEAMS = [...VALID_TEAMS];

export function TeamAssignmentDialog({
  open,
  onClose,
  selectedPlayerIds,
  players,
  onSuccess,
}: TeamAssignmentDialogProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [processing, setProcessing] = useState(false);

  const updateTeam = trpc.player.updateTeam.useMutation();

  const selectedPlayers = players.filter(p => selectedPlayerIds.includes(p.id));

  const handleAssign = async () => {
    if (!selectedTeam) {
      toast.error("Please select a team");
      return;
    }

    setProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const playerId of selectedPlayerIds) {
      try {
        await updateTeam.mutateAsync({
          playerId,
          team: selectedTeam,
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to assign player ${playerId}:`, error);
        errorCount++;
      }
    }

    setProcessing(false);

    if (errorCount === 0) {
      toast.success(`Successfully assigned ${successCount} player${successCount !== 1 ? 's' : ''} to ${selectedTeam}`);
      onSuccess();
      onClose();
    } else {
      toast.error(`Assigned ${successCount} players, but ${errorCount} failed`);
    }

    setSelectedTeam("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Team</DialogTitle>
          <DialogDescription>
            Assign {selectedPlayerIds.length} selected player{selectedPlayerIds.length !== 1 ? 's' : ''} to a team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Selected Players Preview */}
          <div className="max-h-48 overflow-y-auto border border-slate-700 rounded-lg p-3 bg-slate-900">
            <div className="text-sm font-semibold text-slate-400 mb-2">Selected Players:</div>
            <div className="space-y-1">
              {selectedPlayers.map(player => (
                <div key={player.id} className="text-sm text-white flex justify-between">
                  <span>{player.name}</span>
                  <span className="text-slate-400">{player.team || 'No team'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Team Selection */}
          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              Select Destination Team:
            </label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a team..." />
              </SelectTrigger>
              <SelectContent>
                {TEAMS.map(team => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedTeam || processing}
            className="bg-green-600 hover:bg-green-700"
          >
            {processing ? "Assigning..." : `Assign to ${selectedTeam || 'Team'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
