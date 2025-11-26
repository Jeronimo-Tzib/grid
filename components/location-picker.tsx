"use client"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void
  selectedLat: number | null
  selectedLng: number | null
}

function LocationMarker({ onLocationSelect, selectedLat, selectedLng }: LocationPickerProps) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })

  return selectedLat && selectedLng ? <Marker position={[selectedLat, selectedLng]} /> : null
}

export function LocationPicker({ onLocationSelect, selectedLat, selectedLng }: LocationPickerProps) {
  const defaultCenter: [number, number] = [40.7128, -74.006] // New York City default

  return (
    <div className="h-[400px] w-full overflow-hidden rounded-lg border">
      <MapContainer center={defaultCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onLocationSelect={onLocationSelect} selectedLat={selectedLat} selectedLng={selectedLng} />
      </MapContainer>
    </div>
  )
}
