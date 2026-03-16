const fs = require('fs');
const path = require('path');
const https = require('https');

const routesFilePath = path.join(__dirname, '../data/routes.js');

// Load the existing routes
const routesDataStr = fs.readFileSync(routesFilePath, 'utf8');
// Clean up the module.exports to parse as json (simplified extraction)
let routes;
try {
  // A bit hacky but works for the static js file
  const jsonStr = routesDataStr
    .substring(routesDataStr.indexOf('['), routesDataStr.lastIndexOf(']') + 1)
    .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": '); // ensure keys are quoted
  
  // Actually, require might be easier since it's a valid CJS module
  routes = require(routesFilePath);
} catch (e) {
  console.error("Failed to parse routes.js");
  process.exit(1);
}

// Function to fetch route geometry from OSRM
function fetchOSRMPath(stops) {
  return new Promise((resolve, reject) => {
    // OSRM expects: longitude,latitude;longitude,latitude
    const coordinates = stops.map(s => `${s.lng},${s.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.code === 'Ok' && parsed.routes && parsed.routes.length > 0) {
            // geojson coordinates are [lng, lat]
            const pathCoordinates = parsed.routes[0].geometry.coordinates.map(coord => ({
              lat: coord[1],
              lng: coord[0]
            }));
            resolve(pathCoordinates);
          } else {
            console.error("OSRM Error:", parsed.message || parsed.code);
            resolve(null); // Return null on error so we can fallback
          }
        } catch (e) {
          console.error("Error parsing OSRM response:", e);
          resolve(null);
        }
      });
    }).on('error', (e) => {
      console.error("HTTPS Request Error:", e);
      resolve(null);
    });
  });
}

// Helper to delay execution (rate limiting)
const delay = ms => new Promise(res => setTimeout(res, ms));

async function generatePaths() {
  console.log(`Starting path generation for ${routes.length} routes...`);
  
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    console.log(`Fetching path for route ${route.route_id} (${route.name})...`);
    
    // Fetch detailed path
    const detailedPath = await fetchOSRMPath(route.stops);
    
    if (detailedPath) {
      console.log(`  -> Success: mapped ${route.stops.length} stops to ${detailedPath.length} path coordinates.`);
      route.path = detailedPath;
    } else {
      console.warn(`  -> Failed: using straight line stops as fallback.`);
      route.path = [...route.stops]; // Fallback to straight lines
    }
    
    // Be nice to the public OSRM API (max 1 request per second recommended)
    await delay(1200);
  }

  // Write back to a valid JS file format
  const outputStr = `const routes = ${JSON.stringify(routes, null, 2)};\n\nmodule.exports = routes;\n`;
  
  fs.writeFileSync(routesFilePath, outputStr);
  console.log(`Successfully updated ${routesFilePath} with detailed OSRM paths!`);
}

generatePaths();
