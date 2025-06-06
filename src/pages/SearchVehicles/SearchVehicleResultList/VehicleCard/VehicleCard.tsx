import "./VehicleCard.css";
import { useNavigate } from "react-router";
import { formatVehicleImageSrc, spvRoleToKey } from "../../../../utils";
import { useTranslation } from "react-i18next";

interface VehicleCardProps {
  vehicle: SpvVehicleIndex;
}

const VehicleCard = ({ vehicle }: VehicleCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/v/${vehicle.ClassName}`);
  };

  return (
    <div className={`VehicleCard ${vehicle.Size > 4 ? "big" : ""}`} onClick={handleClick}>
      <div className="vehicle-info">
        <p className="vehicle-role">
          {t("VehicleClass.vehicle_class_" + spvRoleToKey(vehicle.Role), {
            defaultValue: t("VehicleFocus.vehicle_focus_" + spvRoleToKey(vehicle.Role), {
              defaultValue: vehicle.Role,
            }),
          })}
        </p>
        <p className="vehicle-name-big">
          {t("Vehicle.vehicle_Name" + vehicle.ClassName, { defaultValue: vehicle.Name })}
        </p>
        <div className="vehicle-price-container">
          {vehicle.Store.Buy ? (
            <p className="vehicle-price-USD">{`$ ${vehicle.Store.Buy.toLocaleString()}`}</p>
          ) : (
            <p className="vehicle-price-USD inactive">{t("VehicleInfo.notBuyableUSD")}</p>
          )}
          {vehicle.PU.Buy ? (
            <p className="vehicle-price-UEC">{`¤ ${vehicle.PU.Buy.toLocaleString()}`}</p>
          ) : (
            <p className="vehicle-price-UEC inactive">{t("VehicleInfo.notBuyableUEC")}</p>
          )}
        </div>
      </div>
      <div
        className="vehicle-thumbnail"
        style={{
          backgroundImage: `url(${formatVehicleImageSrc(vehicle)})`,
          width: vehicle.Type === "Ship" ? (vehicle.Size > 4 ? "45%" : "33%") : "25%",
        }}
      ></div>
    </div>
  );
};

export default VehicleCard;
