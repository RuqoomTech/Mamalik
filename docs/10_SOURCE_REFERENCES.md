# 10 — Source References

These sources support technical decisions and map/geospatial implementation choices. Product/game design decisions are based on the locked Mamalik discussion.

## Next.js

- App Router docs: https://nextjs.org/docs/app
- Route Handlers docs: https://nextjs.org/docs/app/getting-started/route-handlers

Notes:
- Next.js App Router is suitable for the web app structure.
- Route Handlers can provide custom request handlers for app routes.

## MapLibre GL JS

- Documentation: https://www.maplibre.org/maplibre-gl-js/docs/
- Project page: https://maplibre.org/projects/gl-js/

Notes:
- MapLibre GL JS is a TypeScript/WebGL library for interactive browser maps.

## PostgreSQL + PostGIS

- ST_Area: https://postgis.net/docs/ST_Area.html
- ST_DWithin: https://postgis.net/docs/manual-3.1/ST_DWithin.html
- Spatial relationships workshop: https://postgis.net/workshops/postgis-intro/spatial_relationships.html

Notes:
- PostGIS supports polygon area calculations and distance/relationship checks.
- Geography area can be measured in square meters with ST_Area.

## Prisma

- Prisma docs: https://www.prisma.io/docs
- TypedSQL: https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/typedsql
- Raw queries: https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries

Notes:
- Prisma can handle normal game data models.
- TypedSQL/raw SQL can be used for PostGIS-heavy operations.

## OpenStreetMap / map data

- OSM map features: https://wiki.openstreetmap.org/wiki/Map_features
- OSM landuse key: https://wiki.openstreetmap.org/wiki/Key:landuse
- Tile usage policy: https://operations.osmfoundation.org/policies/tiles/
- Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim/
- Nominatim overview: https://nominatim.org/

Notes:
- OSM tags can support feature-aware map logic.
- Public OSM tile and Nominatim services should not be treated as unlimited production infrastructure.

## GeoJSON

- RFC 7946: https://datatracker.ietf.org/doc/html/rfc7946
- GeoJSON overview: https://geojson.org/

Notes:
- GeoJSON is suitable for storing and rendering visible kingdom borders as Polygon/MultiPolygon geometry.
