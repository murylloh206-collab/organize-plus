import { useState } from "react";
import MobileButton from "./MobileButton";
import MobileInput from "./MobileInput";
import BottomSheet from "./BottomSheet";
import { useBottomSheet } from "../../hooks/useBottomSheet";

interface LocationPickerProps {
  value: string;
  onChange: (location: string) => void;
  label?: string;
}

export default function LocationPicker({ value, onChange, label = "Local" }: LocationPickerProps) {
  const locationSheet = useBottomSheet();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(value);

  const openGoogleMaps = () => {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`, '_blank');
  };

  const useCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const location = `${latitude}, ${longitude}`;
        setSelectedLocation(location);
        onChange(location);
        locationSheet.close();
      });
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
        <span className="material-symbols-outlined text-gold text-sm">location_on</span>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={selectedLocation}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSelectedLocation(e.target.value);
            onChange(e.target.value);
          }}
          placeholder="ex: Auditório Central ou URL do Maps"
          className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gold/50"
        />
        <button
          onClick={locationSheet.open}
          className="px-3 py-2.5 bg-gold/10 text-gold rounded-lg hover:bg-gold/20 transition-colors"
        >
          <span className="material-symbols-outlined">map</span>
        </button>
      </div>

      <BottomSheet isOpen={locationSheet.isOpen} onClose={locationSheet.close} title="Escolher Local" maxHeight="60vh">
        <div className="space-y-4 pb-20">
          <MobileInput
            icon="search"
            placeholder="Digite o endereço ou local..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
          <MobileButton variant="primary" fullWidth icon="map" onClick={openGoogleMaps}>
            Abrir no Google Maps
          </MobileButton>
          <MobileButton variant="secondary" fullWidth icon="my_location" onClick={useCurrentLocation}>
            Usar localização atual
          </MobileButton>
          <div className="pt-2 text-center text-xs text-slate-500">
            Após escolher no Google Maps, copie o endereço e cole no campo acima
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}