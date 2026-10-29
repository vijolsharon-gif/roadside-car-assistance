import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon paths in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom SVG Icons
const driverIcon = new L.DivIcon({
  className: 'custom-driver-icon',
  html: `<div class="w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-lg flex items-center justify-center text-sm marker-pulse">🚗</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const mechanicIcon = new L.DivIcon({
  className: 'custom-mechanic-icon',
  html: `<div class="w-8 h-8 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-sm">🔧</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

function LocationPicker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function LeafletMap({
  center = [13.0827, 80.2707],
  zoom = 13,
  driverLocation,
  mechanicLocation,
  nearbyMechanics = [],
  onLocationSelect,
  className = "h-80 w-full rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl",
}) {
  return (
    <div className={className}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapRecenter center={driverLocation || center} />

        {onLocationSelect && <LocationPicker onLocationSelect={onLocationSelect} />}

        {/* Driver location */}
        {driverLocation && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
            <Popup>
              <div className="font-semibold text-xs">🚗 Breakdown Location</div>
            </Popup>
          </Marker>
        )}

        {/* Active Mechanic location */}
        {mechanicLocation && (
          <Marker position={[mechanicLocation.lat, mechanicLocation.lng]} icon={mechanicIcon}>
            <Popup>
              <div className="font-semibold text-xs">🔧 Mechanic On The Way</div>
            </Popup>
          </Marker>
        )}

        {/* Nearby Available Mechanics */}
        {nearbyMechanics.map((m, idx) => (
          m.lat && m.lng ? (
            <Marker key={idx} position={[m.lat, m.lng]} icon={mechanicIcon}>
              <Popup>
                <div className="text-xs">
                  <div className="font-bold">{m.name || 'Nearby Mechanic'}</div>
                  <div>Rating: ⭐ {m.rating || '4.5'}</div>
                  {m.distance && <div>Distance: {m.distance} km</div>}
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
}
