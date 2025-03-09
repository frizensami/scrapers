const got = require('got')
const cheerio = require('cheerio')
const HOST = "https://activesg.gov.sg/api/trpc/pass.getFacilityCapacities"

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

async function extractGymCapacities(url) {
  try {

    /*
        "result": {
          "data": {
            "json": {
              "timestamp": 1741523558380,
              "swimFacilities": [
                {
                  "id": "06b5ad4a-87f5-4d6d-9067-ba0513bacdd6",
                  "name": "Sengkang Swimming Complex",
                  "type": "pool",
                  "capacityInfo": 2,
                  "isClosed": false,
                  "capacityPercentage": 2
                },
              ] 
              ..
              "gymFacilities": [
                            {
              "id": "044cb7b4-7fa8-4cb9-bf5a-ea3e226f6f5d",
              "name": "ActiveSG Gym @ Ang Mo Kio CC",
              "type": "gym",
              "capacityInfo": 56,
              "isClosed": false,
              "capacityPercentage": 56
            },
          
    */
    const response = await got(url, options).json();
    const all_data = response.result.data.json;
    if (all_data === undefined) {
      throw new Error("error with response.result.data.json");
    }

    // Flat-ify data into an array of dicts
    if (!all_data.hasOwnProperty("timestamp")) {
      throw new Error("all_data object is missing expected properties: " + JSON.stringify(all_data))
    }
    const timestamp = all_data.timestamp;
    // Format 
    const human_timestamp = new Date(unix_timestamp).toSOString();

    const swim = all_data.swimFacilities.map((fac) => {
      if (!fac.hasOwnProperty("name") || !fac.hasOwnProperty("isClosed") || !fac.hasOwnProperty("capacityPercentage")) {
        throw new Error("swim object is missing expected properties: " + JSON.stringify(fac))
      }
      return {
        "timestamp": timestamp,
        "human_timestamp": human_timestamp,
        "name": fac.name,
        "isClosed": fac.isClosed,
        "capacity": fac.capacityPercentage
      }
    });
    const gym = all_data.gymFacilities.map(fac => {
      if (!fac.hasOwnProperty("name") || !fac.hasOwnProperty("isClosed") || !fac.hasOwnProperty("capacityPercentage")) {
        throw new Error("gym object is missing expected properties: " + JSON.stringify(fac))
      }
      return {
        "timestamp": timestamp,
        "human_timestamp": human_timestamp,
        "name": fac.name,
        "isClosed": fac.isClosed,
        "capacity": fac.capacityPercentage
      }
    })
    // Concat swim and gym
    const data = swim.concat(gym);
    return { statusCode: 200, body: data };
  } catch (error) {
    return {
      statusCode: error?.response?.statusCode || 500, body: error?.message || error
    }
  }
}

async function runExtracter() {
  const result = await extractGymCapacities(`${HOST}`)
  return { statusCode: result.statusCode, body: JSON.stringify(result.body, null, 2) }
}


exports.handler = async function () {
  return await runExtracter();
}

