"use client";

import {
  BEGINNER_PROTECTION_DAYS,
  STARTER_BUILDINGS,
  STARTER_UNITS,
  STARTING_DISTRICTS,
  STARTING_POPULATION,
  STARTING_RESOURCES,
} from "@mamalik/game/constants";
import type { LocationValidationResponse } from "@/lib/kingdom/location-validation";
import {
  formatKingdomNameError,
  suggestKingdomName,
  validateKingdomName,
} from "@/lib/kingdom/kingdom-name";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type SelectedLocation = {
  latitude: number;
  longitude: number;
};

type KingdomConfirmationPanelProps = {
  selectedLocation: SelectedLocation;
  validationResult: LocationValidationResponse;
  playerDisplayName: string;
  onChangeLocation: () => void;
};

type CreateKingdomResponse =
  | {
      ok: true;
      kingdom: {
        id: string;
        name: string;
        slug: string;
        usableLandM2: number;
      };
      redirectTo: string;
    }
  | {
      error: {
        code: string;
        message: string;
      };
    };

function formatCoordinate(value: number): string {
  return value.toFixed(6);
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function getPolygonPointCount(validationResult: LocationValidationResponse): number {
  return validationResult.previewPolygon?.coordinates[0]?.length ?? 0;
}

export function KingdomConfirmationPanel({
  selectedLocation,
  validationResult,
  playerDisplayName,
  onChangeLocation,
}: KingdomConfirmationPanelProps) {
  const router = useRouter();
  const [kingdomName, setKingdomName] = useState(() => suggestKingdomName(playerDisplayName));
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const nameValidation = useMemo(() => validateKingdomName(kingdomName), [kingdomName]);
  const nameError = formatKingdomNameError(nameValidation);
  const canCreateKingdom = validationResult.valid && nameValidation.ok && !isCreating;

  async function handleCreateKingdom() {
    if (!canCreateKingdom || !nameValidation.ok) {
      return;
    }

    setIsCreating(true);
    setCreateMessage(null);
    setCreateError(null);

    try {
      const response = await fetch("/api/kingdom/create", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: nameValidation.name,
          lat: selectedLocation.latitude,
          lng: selectedLocation.longitude,
        }),
      });
      const result = (await response.json()) as CreateKingdomResponse;

      if (response.ok && "ok" in result && result.ok) {
        setCreateMessage("Kingdom created. Redirecting...");
        router.push(result.redirectTo);
        router.refresh();
        return;
      }

      setCreateError(
        "error" in result ? result.error.message : "Kingdom creation failed. Try again.",
      );
    } catch {
      setCreateError("Kingdom creation could not be reached.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section className="mamalik-card p-5">
      <div className="space-y-5">
        <div>
          <p className="mamalik-eyebrow">
            Validation passed
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[#10140f]">
            Confirm Kingdom
          </h2>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#10140f]">Kingdom name</span>
          <input
            className="mamalik-input px-3 py-2"
            maxLength={32}
            minLength={2}
            onChange={(event) => {
              setKingdomName(event.target.value);
              setCreateMessage(null);
              setCreateError(null);
            }}
            required
            type="text"
            value={kingdomName}
          />
          {nameError ? <span className="text-sm text-red-700">{nameError}</span> : null}
        </label>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[#5f665d]">Latitude</dt>
            <dd className="font-semibold text-[#10140f]">
              {formatCoordinate(selectedLocation.latitude)}
            </dd>
          </div>
          <div>
            <dt className="text-[#5f665d]">Longitude</dt>
            <dd className="font-semibold text-[#10140f]">
              {formatCoordinate(selectedLocation.longitude)}
            </dd>
          </div>
          <div>
            <dt className="text-[#5f665d]">Usable land</dt>
            <dd className="font-semibold text-[#10140f]">
              {formatNumber(validationResult.usableLandM2)} m2
            </dd>
          </div>
          <div>
            <dt className="text-[#5f665d]">Visible area</dt>
            <dd className="font-semibold text-[#10140f]">
              {validationResult.visibleAreaM2
                ? `${formatNumber(validationResult.visibleAreaM2)} m2`
                : "Pending"}
            </dd>
          </div>
          <div>
            <dt className="text-[#5f665d]">Tolerance</dt>
            <dd className="font-semibold text-[#10140f]">
              {validationResult.toleranceStatus ?? "Pending"}
            </dd>
          </div>
        </dl>

        <section className="rounded-md border border-[#dfe5dc] bg-[#f7f8f4] p-3">
          <p className="text-sm font-semibold text-[#10140f]">Preview polygon</p>
          <p className="mt-1 text-sm text-[#5f665d]">
            {validationResult.previewPolygon
              ? `${validationResult.previewPolygon.type} with ${getPolygonPointCount(
                  validationResult,
                )} points`
              : "No preview polygon returned."}
          </p>
        </section>

        <section>
          <p className="text-sm font-semibold text-[#10140f]">Starter resources</p>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-[#5f665d]">Money</dt>
              <dd className="font-semibold text-[#10140f]">
                {formatNumber(STARTING_RESOURCES.money)}
              </dd>
            </div>
            <div>
              <dt className="text-[#5f665d]">Food</dt>
              <dd className="font-semibold text-[#10140f]">
                {formatNumber(STARTING_RESOURCES.food)}
              </dd>
            </div>
            <div>
              <dt className="text-[#5f665d]">Manpower</dt>
              <dd className="font-semibold text-[#10140f]">
                {formatNumber(STARTING_RESOURCES.manpower)}
              </dd>
            </div>
            <div>
              <dt className="text-[#5f665d]">Knowledge</dt>
              <dd className="font-semibold text-[#10140f]">
                {formatNumber(STARTING_RESOURCES.knowledge)}
              </dd>
            </div>
            <div>
              <dt className="text-[#5f665d]">Population</dt>
              <dd className="font-semibold text-[#10140f]">
                {formatNumber(STARTING_POPULATION)}
              </dd>
            </div>
            <div>
              <dt className="text-[#5f665d]">Protection</dt>
              <dd className="font-semibold text-[#10140f]">
                {BEGINNER_PROTECTION_DAYS} days
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <p className="text-sm font-semibold text-[#10140f]">Starting districts</p>
          <ul className="mt-2 space-y-1 text-sm text-[#5f665d]">
            {STARTING_DISTRICTS.map((district) => (
              <li className="flex justify-between gap-3" key={district.type}>
                <span>{district.label}</span>
                <span className="font-semibold text-[#10140f]">
                  {formatNumber(district.allocatedLandM2)} m2
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <p className="text-sm font-semibold text-[#10140f]">Starter buildings</p>
          <ul className="mt-2 grid grid-cols-2 gap-1 text-sm text-[#5f665d]">
            {STARTER_BUILDINGS.map((building) => (
              <li key={building.type}>{building.label}</li>
            ))}
          </ul>
        </section>

        <section>
          <p className="text-sm font-semibold text-[#10140f]">Starter army</p>
          <ul className="mt-2 space-y-1 text-sm text-[#5f665d]">
            {STARTER_UNITS.map((unit) => (
              <li className="flex justify-between gap-3" key={unit.type}>
                <span>{unit.label}</span>
                <span className="font-semibold text-[#10140f]">
                  {formatNumber(unit.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-3">
          <button
            className="mamalik-action-primary w-full px-4 py-2.5"
            disabled={!canCreateKingdom}
            onClick={handleCreateKingdom}
            type="button"
          >
            {isCreating ? "Creating..." : "Create kingdom"}
          </button>
          <button
            className="mamalik-action-secondary w-full px-4 py-2.5"
            onClick={() => {
              setCreateMessage(null);
              setCreateError(null);
              onChangeLocation();
            }}
            type="button"
          >
            Change location
          </button>
        </div>

        {createMessage ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {createMessage}
          </p>
        ) : null}

        {createError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {createError}
          </p>
        ) : null}
      </div>
    </section>
  );
}
