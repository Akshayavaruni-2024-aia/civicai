import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { SEVCOLOR } from './ui'
export const CENTER = [11.0168, 76.9558]
const Tiles = () => <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
export function IssueMap({ points, height = 480, center = CENTER, zoom = 12 }) {
  return <MapContainer center={center} zoom={zoom} style={{ height }} className="z-0 rounded-2xl"><Tiles />
    {points.map(p => <CircleMarker key={p.id} center={[p.latitude, p.longitude]} radius={9 + Math.min(p.report_count || 1, 6)}
      pathOptions={{ color: '#fff', weight: 2, fillColor: SEVCOLOR[p.severity], fillOpacity: 0.9 }}>
      <Popup><div className="text-sm"><b>{p.title}</b><br />{p.category} · <b style={{ color: SEVCOLOR[p.severity] }}>{p.severity}</b><br />Status: {p.status}<br />{p.address || `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`}<br />
        <Link to={`/app/complaints/${p.id}`} className="text-blue-600">View details</Link></div></Popup></CircleMarker>)}
  </MapContainer>
}
function Clicker({ onPick }) { useMapEvents({ click: e => onPick([e.latlng.lat, e.latlng.lng]) }); return null }
export function Picker({ value, onChange }) {
  return <MapContainer center={value || CENTER} zoom={value ? 16 : 12} key={value ? 'p' : 'n'} style={{ height: 300 }} className="z-0 rounded-xl"><Tiles />
    <Clicker onPick={onChange} />{value && <CircleMarker center={value} radius={10} pathOptions={{ color: '#fff', fillColor: '#2563eb', fillOpacity: 1 }} />}
  </MapContainer>
}
