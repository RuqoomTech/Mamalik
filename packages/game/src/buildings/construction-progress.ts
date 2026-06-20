export type ConstructionStatusLike = "ACTIVE" | "CONSTRUCTING" | "UPGRADING";

export type ConstructionProgressInput = {
  status: ConstructionStatusLike;
  constructionRemainingTicks: number;
};

export type ConstructionProgressResult = {
  status: ConstructionStatusLike;
  constructionRemainingTicks: number;
  progressed: boolean;
  completed: boolean;
};

export function progressConstruction(input: ConstructionProgressInput): ConstructionProgressResult {
  const remainingTicks = toNonNegativeInteger(input.constructionRemainingTicks);

  if (input.status === "ACTIVE") {
    return {
      status: "ACTIVE",
      constructionRemainingTicks: remainingTicks,
      progressed: false,
      completed: false,
    };
  }

  if (remainingTicks <= 0) {
    return {
      status: "ACTIVE",
      constructionRemainingTicks: 0,
      progressed: false,
      completed: true,
    };
  }

  const nextRemainingTicks = Math.max(0, remainingTicks - 1);

  if (nextRemainingTicks === 0) {
    return {
      status: "ACTIVE",
      constructionRemainingTicks: 0,
      progressed: true,
      completed: true,
    };
  }

  return {
    status: input.status,
    constructionRemainingTicks: nextRemainingTicks,
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
