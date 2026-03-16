const fs = require('fs');
const path = require('path');
const https = require('https');

const routesFilePath = path.join(__dirname, '../data/routes.js');
const busesFilePath = path.join(__dirname, '../data/buses.js');
const depotsFilePath = path.join(__dirname, '../data/depots.js');

const routes = require(routesFilePath);
const buses = require(busesFilePath);
const depots = require(depotsFilePath);

// 1. Add Depot Connector Route if it doesn't exist
if (!routes.find(r => r.route_id === "R11")) {
  console.log("Adding R11: Depot Connector Circle");
  routes.push({
    route_id: "R11",
    name: "Depot Connector Circle",
    stops: depots.map(d => ({ lat: d.lat, lng: d.lng })),
    frequency: 15,
    route_length_km: 30
  });

  // 2. Add Buses for R11
  const numCurrentBuses = buses.length;
  for (let i = 0; i < 4; i++) {
    const d = depots[i % depots.length];
    buses.push({
      bus_id: `BUS${String(numCurrentBuses + i + 1).padStart(3, '0')}`,
      route_id: "R11",
      lat: d.lat,
      lng: d.lng,
      capacity: 50,
      current_load: 0,
      status: "active"
    });
  }
}

function fetchOSRMPath(stops) {
  return new Promise((resolve) => {
    // Append the first stop to the end to close the geometry loop!
    const closedStops = [...stops, stops[0]];
    const coordinates = closedStops.map(s => `${s.lng},${s.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.code === 'Ok' && parsed.routes && parsed.routes.length > 0) {
            const pathCoordinates = parsed.routes[0].geometry.coordinates.map(coord => ({
              lat: coord[1],
              lng: coord[0]
            }));
            resolve(pathCoordinates);
          } else {
            console.error("OSRM Error:", parsed.message || parsed.code);
            resolve(null);
          }
        } catch (e) {
          console.error("Error parsing response.");
          resolve(null);
        }
      });
    }).on('error', (e) => resolve(null));
  });
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  console.log(`Regenerating closed paths for ${routes.length} routes...`);

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    console.log(`Fetching closed path for ${route.route_id} (${route.name})...`);
    const pathCoords = await fetchOSRMPath(route.stops);
    if (pathCoords) {
      console.log(`  -> Success: mapped ${route.stops.length} stops to ${pathCoords.length} precise road coordinates (loop closed)`);
      route.path = pathCoords;
    } else {
      console.log(`  -> Fallback to direct lines`);
      route.path = [...route.stops, route.stops[0]];
    }
    await delay(1200);
  }

  // Write changes back to files
  const outRoutesStr = `const routes = ${JSON.stringify(routes, null, 2)};\n\nmodule.exports = routes;\n`;
  fs.writeFileSync(routesFilePath, outRoutesStr);

  const outBusesStr = `const buses = ${JSON.stringify(buses, null, 2)};\n\nmodule.exports = buses;\n`;
  fs.writeFileSync(busesFilePath, outBusesStr);

  console.log("Routing fixes entirely complete. Files saved.");
}

run();
