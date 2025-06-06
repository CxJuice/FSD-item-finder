import "./CelestialBodyInfo.css";
import { useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { ContextAllData } from "../../contexts";
import { useTranslation } from "react-i18next";
import { locationNameToI18nKey } from "../../utils";
import CelestialBodyCard from "../../components/CelestialBodyCard/CelestialBodyCard";
import LocationCard from "../../components/LocationCard/LocationCard";

const CelestialBodyInfo = () => {
  const { t } = useTranslation();
  const celestialBodyKey = useParams().celestialBodyKey;
  const { dictCelestialBodies } = useContext(ContextAllData);
  const celestialBody = dictCelestialBodies[celestialBodyKey || ""] || null;

  if (!celestialBody) {
    return (
      <div className="CelestialBodyInfo">
        <div className="basic-info">
          <div className="name">
            <h1>{t("LocationInfo.notFoundCelestialBody")}</h1>
            <h2>{t("LocationInfo.notFoundCelestialBody", { lng: "en" })}</h2>
          </div>
        </div>
      </div>
    );
  }

  const typeInfo = celestialBody.parentBody
    ? t("LocationInfo.typeOfParent", {
        type: t(`LocationType.${celestialBody.type}`),
        parent: t(`Location.${locationNameToI18nKey(celestialBody.parentBody.name)}`),
      })
    : t(`LocationType.${celestialBody.type}`);

  const typeOrder = [
    "Landing zone",
    "Asteroid base",
    "Space station",
    "Space Station",
    "Landmark",
    "Shipwreck",
    "Racetrack",
    "Prison",
    "Scrapyard",
    "Emergency shelter",
    "City",
    "Settlement",
    "Distribution center",
    "Forward operating base",
    "Outpost",
    "Underground bunker",
    "Ruins",
    "Cave",
    "CommArray",
    "Asteroid cluster",
  ];
  const sortedLocations = [...celestialBody.locations].sort((a, b) => {
    const idxA = typeOrder.indexOf(a.type);
    const idxB = typeOrder.indexOf(b.type);
    const orderA = idxA === -1 ? typeOrder.length : idxA;
    const orderB = idxB === -1 ? typeOrder.length : idxB;
    return orderA - orderB;
  });

  return (
    <>
      <div className="CelestialBodyInfo">
        <div className={`basic-info`}>
          <div className="name">
            <h1>{t(`Location.${locationNameToI18nKey(celestialBody.name)}`)}</h1>
            <h2>
              {t(`Location.${locationNameToI18nKey(celestialBody.name)}`, { lng: "en" })}
            </h2>
          </div>
          <h3 className="type">{typeInfo}</h3>
        </div>
        {celestialBody.parentBody && (
          <div className="location-links">
            <h4>{t(`LocationInfo.titleParentBody`)}</h4>
            <ul>
              <li>
                <CelestialBodyCard celestialBody={celestialBody.parentBody} />
              </li>
            </ul>
          </div>
        )}
        {celestialBody.children.length > 0 && (
          <div className="location-links">
            <h4>{t(`LocationInfo.titleChildBodies`)}</h4>
            <ul>
              {celestialBody.children.map((child) => (
                <li key={child.name}>
                  <CelestialBodyCard celestialBody={child} />
                </li>
              ))}
            </ul>
          </div>
        )}
        {celestialBody.locations.length > 0 && (
          <div className="location-links">
            <h4>{t(`LocationInfo.titleLocations`)}</h4>
            <ul>
              {sortedLocations.map((location) => (
                <li key={location.name}>
                  <LocationCard location={location} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};

export default CelestialBodyInfo;
