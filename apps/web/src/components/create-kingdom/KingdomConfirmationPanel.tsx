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
  const [kingdomName, setKingdomName] = useState(() => suggestKingdomName(playerDisplayName));
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const nameValidation = useMemo(() => validateKingdomName(kingdomName), [kingdomName]);
  const nameError = formatKingdomNameError(nameValidation);
  const canCreateKingdom = validationResult.valid && nameValidation.ok;

  function handleCreateKingdom() {
    if (!canCreateKingdom) {
      return;
    }

    setCreateMessage("Kingdom creation API will be connected in the next task.");
  }

  return (
    <section className="rounded-md border border-neutral-200 bg-white p-5">
      <div className="space-y-5">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            Validation passed
          </p>
          <h2 className="mt-1 text-xl font-semibold text-neutral-950">
            Confirm Kingdom
          </h2>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-800">Kingdom name</span>
          <input
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-950 outline-none focus:border-neutral-950"
            maxLength={32}
            minLength={2}
            onChange={(event) => {
              setKingdomName(event.target.value);
              setCreateMessage(null);
            }}
            required
            type="text"
            value={kingdomName}
          />
          {nameError ? <span className="text-sm text-red-700">{nameError}</span> : null}
        </label>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-neutral-500">Latitude</dt>
            <dd className="font-medium text-neutral-950">
              {formatCoordinate(selectedLocation.latitude)}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Longitude</dt>
            <dd className="font-medium text-neutral-950">
              {formatCoordinate(selectedLocation.longitude)}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Usable land</dt>
            <dd className="font-medium text-neutral-950">
              {formatNumber(validationResult.usableLandM2)} m2
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Visible area</dt>
            <dd className="font-medium text-neutral-950">
              {validationResult.visibleAreaM2
                ? `${formatNumber(validationResult.visibleAreaM2)} m2`
                : "Pending"}
            </dd>
          </div>
        </dl>

        <section className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-sm font-medium text-neutral-950">Preview polygon</p>
          <p className="mt-1 text-sm text-neutral-600">
            {validationResult.previewPolygon
              ? `${validationResult.previewPolygon.type} with ${getPolygonPointCount(
                  validationResult,
                )} points`
              : "No preview polygon returned."}
          </p>
        </section>

        <section>
          <p className="text-sm font-medium text-neutral-950">Starter resources</p>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-neutral-500">Money</dt>
              <dd className="font-medium text-neutral-950">
                {formatNumber(STARTING_RESOURCES.money)}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Food</dt>
              <dd className="font-medium text-neutral-950">
                {formatNumber(STARTING_RESOURCES.food)}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Manpower</dt>
              <dd className="font-medium text-neutral-950">
                {formatNumber(STARTING_RESOURCES.manpower)}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Knowledge</dt>
              <dd className="font-medium text-neutral-950">
                {formatNumber(STARTING_RESOURCES.knowledge)}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Population</dt>
              <dd className="font-medium text-neutral-950">
                {formatNumber(STARTING_POPULATION)}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Protection</dt>
              <dd className="font-medium text-neutral-950">
                {BEGINNER_PROTECTION_DAYS} days
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <p className="text-sm font-medium text-neutral-950">Starting districts</p>
          <ul className="mt-2 space-y-1 text-sm text-neutral-600">
            {STARTING_DISTRICTS.map((district) => (
              <li className="flex justify-between gap-3" key={district.type}>
                <span>{district.type}</span>
                <span className="font-medium text-neutral-950">
                  {formatNumber(district.allocatedLandM2)} m2
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <p className="text-sm font-medium text-neutral-950">Starter buildings</p>
          <ul className="mt-2 grid grid-cols-2 gap-1 text-sm text-neutral-600">
            {STARTER_BUILDINGS.map((building) => (
              <li key={building}>{building}</li>
            ))}
          </ul>
        </section>

        <section>
          <p className="text-sm font-medium text-neutral-950">Starter army</p>
          <ul className="mt-2 space-y-1 text-sm text-neutral-600">
            {STARTER_UNITS.map((unit) => (
              <li className="flex justify-between gap-3" key={unit.type}>
                <span>{unit.type}</span>
                <span className="font-medium text-neutral-950">
                  {formatNumber(unit.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-3">
          <button
            className="w-full rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
            disabled={!canCreateKingdom}
            onClick={handleCreateKingdom}
            type="button"
          >
            Create kingdom
          </button>
          <button
            className="w-full rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-100"
            onClick={() => {
              setCreateMessage(null);
              onChangeLocation();
            }}
            type="button"
          >
            Change location
          </button>
        </div>

        {createMessage ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {createMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}
