# Sprint 6 — Alliances + Reports + Rankings + Admin Polish

## Sprint goal

Add the social, reporting, leaderboard, and admin layers needed for a v0.1 playable test release.

## Scope

### 1. Alliances

Implement simple v0.1 alliance features:

- create alliance
- join alliance
- leave alliance
- alliance name
- alliance tag
- alliance description
- member list
- leader role

### 2. Alliance limit

Lock 20 members per alliance in v0.1.

Rules:

- cannot join if full
- one kingdom can belong to only one alliance
- leader cannot leave without transferring leadership or disbanding later

### 3. Friendly fire prevention

Alliance members cannot attack each other.

This must be enforced in:

- attack validation
- scout validation if friendly scouting is disabled
- diplomacy state checks

### 4. Diplomacy states

Implement states:

- Neutral
- Ally
- War

For v0.1:

- Ally means same alliance.
- War can be a declared relation.
- Neutral is default.

### 5. Announcements placeholder

Full chat is not in v0.1.

Optional simple alliance announcements:

- leader can post announcement
- members can read announcement
- no real-time chat

### 6. Notification center

Basic notifications for:

- construction finished
- training finished
- army arrived
- scout report ready
- battle ended
- land purchase completed
- protection ended

### 7. Report center

Implement unified report inbox:

- battle reports
- scout reports
- land purchase reports
- construction reports

Filters:

- all
- battle
- scout
- economy/land
- construction

### 8. Rankings

Implement v0.1 rankings:

- Total land
- Military power
- Economy score
- Knowledge/technology score

Alliance score is later.

### 9. Admin polish

Admin should be able to:

- view users
- view kingdoms
- view resources
- view armies
- view active movements
- view reports
- view alliances
- run test tick
- inspect recent errors

### 10. v0.1 QA pass

Run a manual flow:

1. Create two users.
2. Create two kingdoms.
3. Run ticks.
4. Build/upgrade.
5. Train units.
6. Buy land.
7. Scout.
8. Attack.
9. Generate reports.
10. Create alliance.
11. Check rankings.
12. Verify admin views.

## Out of scope

- Real-time chat
- Advanced roles/officers
- Alliance score
- Peace treaties
- Non-aggression pacts
- Vassals
- Trade agreements

## Acceptance criteria

- [ ] Player can create an alliance.
- [ ] Player can join/leave alliance.
- [ ] Alliance member limit of 20 is enforced.
- [ ] Alliance members cannot attack each other.
- [ ] Neutral/Ally/War states exist and affect validation.
- [ ] Basic notification center works.
- [ ] Report center displays battle, scout, land, and construction reports.
- [ ] Rankings show Total land, Military power, Economy score, Knowledge score.
- [ ] Admin can inspect users, kingdoms, reports, alliances, and tick logs.
- [ ] v0.1 manual QA flow passes.

