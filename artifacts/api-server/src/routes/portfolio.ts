import { Router } from "express";
import { db } from "@workspace/db";
import { portfolioSnapshotsTable } from "@workspace/db";
import { eq, asc, sql } from "drizzle-orm";

const router = Router();

async function requireAuth(req: any, res: any): Promise<boolean> {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

// GET /portfolio/history
router.get("/portfolio/history", async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  const userId = req.user!.id;

  // Get daily aggregated snapshots (take the last snapshot per day)
  const snapshots = await db
    .select({
      id: portfolioSnapshotsTable.id,
      userId: portfolioSnapshotsTable.userId,
      totalValue: portfolioSnapshotsTable.totalValue,
      totalCost: portfolioSnapshotsTable.totalCost,
      snapshotDate: portfolioSnapshotsTable.snapshotDate,
    })
    .from(portfolioSnapshotsTable)
    .where(eq(portfolioSnapshotsTable.userId, userId))
    .orderBy(asc(portfolioSnapshotsTable.snapshotDate))
    .limit(90);

  res.json(
    snapshots.map((s) => ({
      id: s.id,
      userId: s.userId,
      totalValue: Number(s.totalValue),
      totalCost: Number(s.totalCost),
      snapshotDate: s.snapshotDate.toISOString(),
    }))
  );
});

export { router as portfolioRouter };
