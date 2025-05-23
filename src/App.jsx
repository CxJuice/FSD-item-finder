import { useEffect, useState } from "react";
import "./App.css";
import SearchBar from "./components/SearchBar/SearchBar";
import { Route, Routes } from "react-router";
import axios from "axios";
import {
  AllTerminalsContext,
  AllItemsPriceContext,
  BodiesAndLocationsContext,
} from "./contexts";
import itemsUexIdsAndI18n from "./data/items_uex_ids_and_i18n.json";
import uexBodiesFixM from "./data/uex_bodies_fix_manual.json";
import {
  buildDataBodiesAndLocations,
  date4_0,
  getItemUexFormat,
  getPathTo,
  getPathToTerminal,
  mapToUEXTypeSubType,
} from "./utils";
import Item from "./pages/Item/Item";
import Terminal from "./pages/Terminal/Terminal";
import Footer from "./components/Footer/Footer";
import TerminalIndex from "./pages/TerminalIndex/TerminalIndex";

// Add IndexedDB caching utility functions
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("FSDFCache", 1);
    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("apiCache")) {
        db.createObjectStore("apiCache");
      }
    };
    request.onsuccess = function (event) {
      resolve(event.target.result);
    };
    request.onerror = function (event) {
      reject(event.target.error);
    };
  });
}

async function readCache(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("apiCache", "readonly");
    const store = transaction.objectStore("apiCache");
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function writeCache(key, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("apiCache", "readwrite");
    const store = transaction.objectStore("apiCache");
    const req = store.put(data, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function fetchWithCache(key, url) {
  let now = Date.now();
  const oneDay = 86400000;
  const oneMonth = 2592000000;
  try {
    const cached = await readCache(key);
    if (cached && cached.timestamp) {
      const age = now - cached.timestamp;
      if (age < oneDay) {
        // Cache is less than one day, return cached data.
        return cached.data;
      } else if (age < oneMonth) {
        // Cache is older than one day but less than one month: return cached data and refresh in background.
        axios.get(url)
          .then(res => {
            writeCache(key, { timestamp: Date.now(), data: res.data })
              .catch(e => console.error("Failed to refresh cache in background", e));
          })
          .catch(e => console.error("Failed to refresh data in background", e));
        return cached.data;
      }
    }
  } catch (e) {
    console.error("Failed to read cache", e);
  }
  // No valid cache or cache older than one month: refresh cache in foreground.
  const res = await axios.get(url);
  const data = res.data;
  try {
    await writeCache(key, { timestamp: Date.now(), data });
  } catch (e) {
    console.error("Failed to write cache", e);
  }
  return data;
}

function App() {
  const [terminalsData, setTerminalsData] = useState({});
  const [itemsData, setItemsData] = useState({});
  const [bodiesAndLocationsData, setBodiesAndLocationsData] = useState([{}, {}, {}]);
  const [item, setItem] = useState(null);
  const [isItemsDataAcquired, setIsItemsDataAcquired] = useState(false);

  useEffect(() => {
    const [dictSystems, dictBodies, dictLocations] = buildDataBodiesAndLocations();

    const fetchData = async () => {
      /* Fetch & reformat terminals */
      try {
        const res = await fetchWithCache("terminals", "https://api.uexcorp.space/2.0/terminals");
        let temp = res.data.map((t) => {
          let orbit_name_fix = uexBodiesFixM[t.orbit_name] || t.orbit_name;
          if (t.star_system_name === "Pyro" && t.orbit_name === "Pyro Jump Point")
            orbit_name_fix = "Stanton Jump Point";
          let locPath3rd = t.name.split(" - ").reverse();
          if (locPath3rd[0] === "Stanton Gateway Station")
            locPath3rd[0] = "Stanton Gateway";
          if (locPath3rd[0] === "Terra Gateway Station") locPath3rd[0] = "Terra Gateway";
          if (locPath3rd[0] === "Orbituary Station") locPath3rd[0] = "Orbituary";
          let locationPath = [t.star_system_name, orbit_name_fix, ...locPath3rd];
          /* Deprecated */
          locationPath = locationPath.filter((loc, idx) =>
            idx > 0 ? loc !== locationPath[idx - 1] : true
          );
          return {
            id: t.id,
            code: t.code,
            name: t.name,
            type: t.type,
            parentLocation: null,
            location_path: locationPath,
            location: {
              name_star_system: t.star_system_name,
              name_planet: t.planet_name,
              name_orbit: orbit_name_fix,
              name_moon: t.moon_name,
              name_space_station: t.space_station_name,
              name_outpost: t.outpost_name,
              name_city: t.city_name,
            },
            name_faction: t.faction_name,
            name_company: t.company_name,
            is_affinity_influenceable: t.is_affinity_influenceable,
            is_habitation: t.is_habitation,
            is_refinery: t.is_refinery,
            is_cargo_center: t.is_cargo_center,
            is_medical: t.is_medical,
            is_food: t.is_food,
            is_shop_fps: t.is_shop_fps,
            is_shop_vehicle: t.is_shop_vehicle,
            is_refuel: t.is_refuel,
            is_repair: t.is_repair,
            is_nqa: t.is_nqa,
            is_player_owned: t.is_player_owned,
            is_auto_load: t.is_auto_load,
            has_loading_dock: t.has_loading_dock,
            has_docking_port: t.has_docking_port,
            has_freight_elevator: t.has_freight_elevator,
          };
        });
        let tempDict = {};
        for (const t of temp) {
          tempDict[t.id] = t;

          let terminalAt =
            t.location.name_space_station ||
            t.location.name_outpost ||
            t.location.name_city;

          if (!terminalAt) continue;

          const d = {
            "Area 18": "Area18",
            "Green Imperial Housing Exchange": "GrimHEX",
            "Deakins Research": "Deakins Research Outpost",
            "Hickes Research": "Hickes Research Outpost",
            "Private Property": "PRIVATE PROPERTY",
            "HDMS-Anderson": "HDMS Anderson",
            "HDMS-Norgaard": "HDMS Norgaard",
            "Shady Glen": "Shady Glen Farms",
            "Rod's Fuel & Supplies": "Rod's Fuel 'N Supplies",
          };
          if (d[terminalAt]) terminalAt = d[terminalAt];

          const regexStationLagrange = /^[A-Za-z]{3}-L\d.*Station$/;
          if (regexStationLagrange.test(terminalAt)) {
            terminalAt = terminalAt.slice(terminalAt.indexOf(" ") + 1);
          }

          if (terminalAt.endsWith(" Gateway")) {
            terminalAt = terminalAt + ` (${t.location.name_star_system})`;
          }

          if (dictLocations[terminalAt]) {
            t.parentLocation = dictLocations[terminalAt];
            t.location_path = getPathToTerminal(t);
            dictLocations[terminalAt].terminals.push(t);
          } else {
            // console.log(t.id, t.name);
          }
        }
        // console.log(tempDict);
        setTerminalsData(tempDict);
      } catch (err) {
        console.log(err);
      }
      /* Fetch & reformat items */
      let dictItem = {};
      try {
        const res = await fetchWithCache("items_prices_all", "https://api.uexcorp.space/2.0/items_prices_all");
        for (const item of res.data) {
          let id = item.id_item;
          if (!dictItem[id]) {
            dictItem[id] = {
              id_item: id,
              options: [],
            };
          }
          dictItem[id].options.push({
            id_terminal: item.id_terminal,
            price_buy: item.price_buy || Infinity,
            price_sell: item.price_sell || 0,
            date_modified: item.date_modified,
          });
        }
        setIsItemsDataAcquired(true);
      } catch (err) {
        setIsItemsDataAcquired(false);
        console.log(err);
      }
      /* Fetch & reformat vehicles */
      try {
        const res = await fetchWithCache("vehicles_purchases_prices_all", "https://api.uexcorp.space/2.0/vehicles_purchases_prices_all");
        for (const v of res.data) {
          let id = "v-" + v.id_vehicle;
          if (!dictItem[id]) {
            dictItem[id] = {
              id_vehicle: v.id_vehicle,
              options: [],
              options_rent: [],
            };
          }
          dictItem[id].options.push({
            id_terminal: v.id_terminal,
            price_buy: v.price_buy || Infinity,
            date_modified: v.date_modified,
          });
        }
      } catch (err) {
        console.log(err);
      }
      try {
        const res = await fetchWithCache("vehicles_rentals_prices_all", "https://api.uexcorp.space/2.0/vehicles_rentals_prices_all");
        for (const v of res.data) {
          let id = "v-" + v.id_vehicle;
          if (!dictItem[id]) {
            dictItem[id] = {
              id_vehicle: v.id_vehicle,
              options: [],
              options_rent: [],
            };
          }
          dictItem[id].options_rent.push({
            id_terminal: v.id_terminal,
            price_rent: v.price_rent || Infinity,
            date_modified: v.date_modified,
          });
        }
      } catch (err) {
        console.log(err);
      }

      // console.log(dictItem);

      /* Rebuild dictionary with keys */
      const tempItemsData = {};

      for (const [key, value] of Object.entries(itemsUexIdsAndI18n)) {
        let firstId = value.uex_ids?.[0];
        let isVehicle = typeof firstId === "string" && firstId?.startsWith("v-");
        if (isVehicle) {
          tempItemsData[key] = {
            key: key,
            name: value.en || key,
            name_zh_Hans: value.zh_Hans || key,
            type: "Vehicle",
            sub_type: "Vehicle",
            id_vehicle: firstId,
            price_min_max: {},
            options: dictItem[firstId]?.options || [],
            options_rent: dictItem[firstId]?.options_rent || [],
          };
        } else {
          let itemUexFormat = getItemUexFormat(firstId);
          let type = itemUexFormat?.section;
          let subType = itemUexFormat?.category;
          if (subType == "Jump Modules") {
            type = "Systems";
          } else if (subType == "Undersuits") {
            type = "Armor";
          }
          if (!type || !subType) {
            let remapped = mapToUEXTypeSubType(value.type);
            type = type || remapped[0];
            subType = subType || remapped[1];
          }
          if (type === null && !value.uex_ids) continue;
          tempItemsData[key] = {
            key: key,
            name: value.en || key,
            name_zh_Hans: value.zh_Hans || key,
            type: type,
            sub_type: subType,
            screenshot: itemUexFormat?.screenshot,
            slug: itemUexFormat?.slug,
            id_item: firstId,
            price_min_max: {},
            options: [],
            attributes: itemUexFormat?.attributes,
          };
          let optionDict = {};
          if (value.uex_ids)
            for (const id of value.uex_ids) {
              if (!dictItem[id]) continue;
              for (const option of dictItem[id].options) {
                if (!optionDict[option.id_terminal]) {
                  optionDict[option.id_terminal] = option;
                } else {
                  optionDict[option.id_terminal].price_buy = Math.min(
                    optionDict[option.id_terminal].price_buy,
                    option.price_buy
                  );
                  optionDict[option.id_terminal].price_sell = Math.max(
                    optionDict[option.id_terminal].price_sell,
                    option.price_sell
                  );
                }
              }
            }
          tempItemsData[key].options = Object.values(optionDict);
          tempItemsData[key].options.forEach((o) => {
            if (o.price_buy === Infinity) o.price_buy = null;
            if (o.price_sell === 0) o.price_sell = null;
          });
        }
      }

      // console.log(Object.values(tempItemsData));

      /* Update price_min_max for each item */
      Object.values(tempItemsData).forEach((item) => {
        let pricesBuy = item.options
          .filter((a) => a.price_buy !== null && a.date_modified >= date4_0)
          .map((a) => a.price_buy);
        let pricesSell = item.options
          .filter((a) => a.price_sell !== null && a.date_modified >= date4_0)
          .map((a) => a.price_sell);
        let pricesRent =
          item.options_rent
            ?.filter((a) => a.price_rent !== null && a.date_modified >= date4_0)
            ?.map((a) => a.price_rent) || [];
        item.price_min_max = {
          buy_min: Math.min(...pricesBuy) || null,
          buy_max: Math.max(...pricesBuy) || null,
          sell_min: Math.min(...pricesSell) || null,
          sell_max: Math.max(...pricesSell) || null,
          rent_min: Math.min(...pricesRent) || null,
          rent_max: Math.max(...pricesRent) || null,
        };
      });

      // console.log(Object.values(tempItemsData));
      setItemsData(tempItemsData);
    };

    fetchData();

    setBodiesAndLocationsData([dictSystems, dictBodies, dictLocations]);
  }, []);

  return (
    <BodiesAndLocationsContext.Provider value={bodiesAndLocationsData}>
      <AllTerminalsContext.Provider value={terminalsData}>
        <AllItemsPriceContext.Provider value={itemsData}>
          <Routes>
            <Route
              path="/t"
              element={
                <>
                  <TerminalIndex />
                  <Footer />
                </>
              }
            />
            <Route
              path="/t/:tid"
              element={
                <>
                  <Terminal />
                  <Footer />
                </>
              }
            />
            <Route
              path="*"
              element={
                <>
                  <SearchBar
                    centered={item === null}
                    dataAcquired={isItemsDataAcquired}
                  />
                  <Item item={item} setItem={setItem} />
                  <Footer style={{ position: item ? "unset" : "absolute" }} />
                </>
              }
            />
          </Routes>
        </AllItemsPriceContext.Provider>
      </AllTerminalsContext.Provider>
    </BodiesAndLocationsContext.Provider>
  );
}

export default App;
