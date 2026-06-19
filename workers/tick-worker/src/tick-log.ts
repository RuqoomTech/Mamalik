export type TickRunStatus = "COMPLETED" | "FAILED" | "SKIPPED";

export type TickRunResult = {
  tickKey: string;
  status: TickRunStatus;
  processedKingdomCount: number;
  startedAt: Date;
  finishedAt: Date;
  errorMessage?: string;
};

export function isDuplicateTickInsert(insertedRowCount: number): boolean {
  return insertedRowCount === 0;
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return "Unknown tick worker error.";
}

export function formatTickRunResult(result: TickRunResult): string {
  const lines = [
    `Tick key: ${result.tickKey}`,
    `Status: ${result.status}`,
    `Processed kingdoms: ${result.processedKingdomCount}`,
    `Started at: ${result.startedAt.toISOString()}`,
    `Finished at: ${result.finishedAt.toISOString()}`,
  ];

  if (result.errorMessage) {
    lines.push(`Error: ${result.errorMessage}`);
  }

  return lines.join("\n");
}
