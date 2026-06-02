# Sprint 4 - Map Validation + Borders

## Goal

Replace Sprint 1 temporary location validation with v0.1-ready real-world validation and visible border generation.

## Scope

- Valid land checks.
- Water rejection.
- Restricted-zone placeholders.
- Dynamic buffer.
- No overlap.
- Visible polygon preview.
- Nearby valid point suggestions.
- PostGIS spatial helpers.

## Required Validation

- Valid latitude/longitude.
- Land only, not water.
- Not inside a restricted zone.
- Not overlapping existing kingdoms.
- Not too close to existing kingdoms under the dynamic buffer rule.
- Able to generate a starting border.

## Visible Border Generation

Use locked tolerance:

1. Try 49,000-51,000 m2.
2. Try 45,000-55,000 m2.
3. Use fallback generated polygon if needed.

Gameplay land remains exactly 50,000 m2 usable land credit.

## Nearby Suggestions

If a clicked point is invalid, suggest nearby valid points using a simple scan around the click and return the best 3 options.

## Out Of Scope

- Perfect OSM parcel matching.
- Real property parcel ownership data.
- Advanced natural border smoothing.
- Production-grade global tile hosting.

## Acceptance Criteria

- [ ] Clicking water is rejected.
- [ ] Clicking too close to another kingdom is rejected.
- [ ] Dynamic buffer uses area type.
- [ ] Existing kingdom overlap is rejected.
- [ ] Restricted-zone placeholder check exists.
- [ ] A valid starting point returns a visible polygon preview.
- [ ] Visible polygon uses dynamic tolerance or fallback.
- [ ] Usable land remains exactly 50,000 m2.
- [ ] Invalid clicks return useful reasons.
- [ ] Invalid clicks can return nearby valid suggestions.
