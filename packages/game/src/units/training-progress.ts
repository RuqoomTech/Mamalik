export type TrainingQueueStatusLike = "ACTIVE" | "COMPLETED" | "CANCELLED";

export type TrainingProgressInput = {
  status: TrainingQueueStatusLike;
  remainingTicks: number;
};

export type TrainingProgressResult = {
  status: TrainingQueueStatusLike;
  remainingTicks: number;
  progressed: boolean;
  completed: boolean;
};

export function progressTraining(input: TrainingProgressInput): TrainingProgressResult {
  const remainingTicks = toNonNegativeInteger(input.remainingTicks);

  if (input.status === "COMPLETED" || input.status === "CANCELLED") {
    return {
      status: input.status,
      remainingTicks,
      progressed: false,
      completed: false,
    };
  }

  if (remainingTicks <= 0) {
    return {
      status: "COMPLETED",
      remainingTicks: 0,
      progressed: false,
      completed: true,
    };
  }

  const nextRemainingTicks = Math.max(0, remainingTicks - 1);

  if (nextRemainingTicks === 0) {
    return {
      status: "COMPLETED",
      remainingTicks: 0,
      progressed: true,
      completed: true,
    };
  }

  return {
    status: "ACTIVE",
    remainingTicks: nextRemainingTicks,
    progressed: true,
    completed: false,
  };
}

function toNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}
