import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { players } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const csvExportRouter = router({
  generateCsv: publicProcedure
    .input(
      z.object({
        columns: z.array(z.string()),
        filterType: z.enum(["all", "rookies", "team"]),
        team: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { columns, filterType, team } = input;

      // Build query based on filter
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      let query = db.select().from(players);

      if (filterType === "rookies") {
        query = query.where(eq(players.isRookie, 1)) as any;
      } else if (filterType === "team" && team) {
        query = query.where(eq(players.team, team)) as any;
      }

      const playerData = await query;

      // Generate CSV header
      const headers: string[] = [];
      const columnMap: Record<string, string> = {
        fullName: "Full Name",
        firstInitialLastName: "First Initial Last Name",
        team: "Team",
        overall: "Overall",
        photoUrl: "Photo URL",
        playerPageUrl: "2K Ratings URL",
        height: "Height",
        isRookie: "Rookie Status",
        draftYear: "Draft Year",
        salaryCap: "Salary Cap",
      };

      columns.forEach((col) => {
        if (columnMap[col]) {
          headers.push(columnMap[col]);
        }
      });

      // Generate CSV rows
      const rows: string[][] = [];
      playerData.forEach((player) => {
        const row: string[] = [];

        columns.forEach((col) => {
          let value = "";

          switch (col) {
            case "fullName":
              value = player.name || "";
              break;
            case "firstInitialLastName":
              if (player.name) {
                const parts = player.name.split(" ");
                if (parts.length > 1) {
                  const firstName = parts[0];
                  const lastName = parts.slice(1).join(" ");
                  value = `${firstName.charAt(0)} ${lastName}`;
                } else {
                  value = player.name;
                }
              }
              break;
            case "team":
              value = player.team || "";
              break;
            case "overall":
              value = player.overall?.toString() || "";
              break;
            case "photoUrl":
              value = player.photoUrl || "";
              break;
            case "playerPageUrl":
              value = player.playerPageUrl || "";
              break;
            case "height":
              value = player.height || "";
              break;
            case "isRookie":
              value = player.isRookie ? "Yes" : "No";
              break;
            case "draftYear":
              value = player.draftYear?.toString() || "";
              break;
            case "salaryCap":
              value = player.salaryCap || "";
              break;
          }

          // Escape CSV values that contain commas, quotes, or newlines
          if (value.includes(",") || value.includes('"') || value.includes("\n")) {
            value = `"${value.replace(/"/g, '""')}"`;
          }

          row.push(value);
        });

        rows.push(row);
      });

      // Build CSV string
      const csvLines = [headers.join(",")];
      rows.forEach((row) => {
        csvLines.push(row.join(","));
      });
      const csv = csvLines.join("\n");

      // Generate filename
      const timestamp = new Date().toISOString().split("T")[0];
      let filename = `nba2k26_players_${timestamp}.csv`;
      if (filterType === "rookies") {
        filename = `nba2k26_rookies_${timestamp}.csv`;
      } else if (filterType === "team" && team) {
        filename = `nba2k26_${team.toLowerCase().replace(/\s+/g, "_")}_${timestamp}.csv`;
      }

      return {
        csv,
        filename,
      };
    }),
});
