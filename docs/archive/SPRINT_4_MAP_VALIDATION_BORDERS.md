# Sprint 4 — Real Map Validation + Border Improvements

## Sprint goal

Replace Sprint 1's temporary location validation with stronger real-world validation and better kingdom border generation suitable for v0.1 testing.

## Scope

### 1. Valid location checks

Implement real checks for:

- valid latitude/longitude
- land area only
- not water
- not overlapping existing kingdoms
- dynamic buffer from existing kingdoms
- restricted zone placeholder
- ability to generate starting border

### 2. Dynamic buffer

Implement locked dynamic buffer logic:

| Area type | Buffer |
|---|---:|
| Dense city | smaller buffer |
| Suburbs/urban | medium buffer |
| Desert/rural | larger buffer |

Suggested v0.1 values:

| Area type | Buffer |
|---|---:|
| Dense city | 100 m |
| Suburb/urban | 250 m |
| Rural/desert | 500 m |

### 3. Area type classification v0.1

Implement a simple classifier using available map/OSM data or placeholders.

At minimum:

- dense city
- urban/suburb
- rural/desert
- unknown fallback

### 4. Water rejection

Reject obvious water locations using available map data. For v0.1, this can be approximate but must prevent common invalid clicks on seas/lakes.

### 5. Restricted zone placeholder

Add a restricted zone table and checking system, even if only seeded with test zones in v0.1.

Fields:

- id
- name
- reason
- geometry
- enabled

### 6. Visible border generation

Implement starting visible polygon generation with locked dynamic tolerance:

1. Try 49,000–51,000 m².
2. Try 45,000–55,000 m² if needed.
3. Custom fallback polygon if needed.

Game balance still uses exactly 50,000 m² usable land credit.

### 7. Nearby valid suggestions

If a clicked point is invalid, suggest nearby valid points.

Simple ring scan:

- 100 m
- 250 m
- 500 m
- 1 km

Directions:

- N, E, S, W
- NE, SE, SW, NW

Return best 3 valid suggestions.

### 8. Map preview UI

Update create kingdom flow:

- show invalid reason
- show nearby suggestions
- show preview border
- show visible area estimate
- show usable land credit
- show area type
- show dynamic buffer result

## Out of scope

- Perfect OSM parcel matching
- Real property parcel ownership data
- Advanced natural border smoothing
- Production-grade global tile hosting

## Acceptance criteria

- [ ] Clicking water is rejected.
- [ ] Clicking too close to another kingdom is rejected.
- [ ] Dynamic buffer uses area type.
- [ ] Existing kingdom overlap is rejected.
- [ ] Restricted-zone placeholder check exists.
- [ ] A valid starting point returns a visible polygon preview.
- [ ] Visible polygon uses dynamic tolerance or fallback.
- [ ] Usable land remains exactly 50,000 m².
- [ ] Invalid clicks return useful reasons.
- [ ] Invalid clicks can return nearby valid suggestions.

