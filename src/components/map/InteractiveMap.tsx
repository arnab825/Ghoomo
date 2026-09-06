"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Place } from "@/lib/types/ghoomo";
import { ChevronDown, ChevronUp, Layers, Compass, Check } from "lucide-react";
import "leaflet/dist/leaflet.css";

export const DAY_PALETTE = [
  "#0d9488", // Day 1: Teal 600
  "#0284c7", // Day 2: Sky 600
  "#7c3aed", // Day 3: Violet 600
  "#ea580c", // Day 4: Orange 600
  "#059669", // Day 5: Emerald 600
  "#e11d48", // Day 6: Rose 600
  "#d97706", // Day 7: Amber 600
  "#2563eb", // Day 8: Blue 600
  "#9333ea", // Day 9: Purple 600
  "#0891b2", // Day 10: Cyan 600
  "#4f46e5", // Day 11: Indigo 600
  "#be123c", // Day 12: Rose 700
];

export function getDayColor(dayNumber: number): string {
  if (!dayNumber || dayNumber <= 0) return "#64748b"; // Slate 500 for unassigned
  return DAY_PALETTE[(dayNumber - 1) % DAY_PALETTE.length];
}

interface InteractiveMapProps {
  places: Place[];
  selectedPlaceId?: string | null;
  onSelectPlace?: (placeId: string) => void;
  highlightDay?: number | null;
  onSelectDay?: (dayNumber: number | null) => void;
  durationDays?: number;
}

export default function InteractiveMap({
  places,
  selectedPlaceId,
  onSelectPlace,
  highlightDay,
  onSelectDay,
  durationDays,
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const polylinesLayerRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const polylinesRef = useRef<Record<number, any>>({});
  const [isLegendExpanded, setIsLegendExpanded] = useState(true);

  // Compute active days and counts
  const { totalDays, placesCountByDay, unassignedCount } = useMemo(() => {
    const counts: Record<number, number> = {};
    let maxDay = durationDays || 1;
    let unassigned = 0;

    places.forEach((p) => {
      const d = p.assignedDay || 0;
      if (d > 0) {
        counts[d] = (counts[d] || 0) + 1;
        if (d > maxDay) maxDay = d;
      } else {
        unassigned++;
      }
    });

    return {
      totalDays: maxDay,
      placesCountByDay: counts,
      unassignedCount: unassigned,
    };
  }, [places, durationDays]);

  // 1. Initialize Map & Render Places/Routes (Only re-runs when `places` changes)
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Initialize Leaflet map instance once
      if (!mapInstanceRef.current) {
        const initialLat = places.length > 0 && typeof places[0].lat === "number" ? places[0].lat : 26.9124;
        const initialLng = places.length > 0 && typeof places[0].lng === "number" ? places[0].lng : 75.7873;

        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: 12,
          zoomControl: false,
        });

        // Free OpenStreetMap tile layer (No watermarks, No API key)
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: "bottomright" }).addTo(map);

        mapInstanceRef.current = map;
        polylinesLayerRef.current = L.layerGroup().addTo(map);
        markersLayerRef.current = L.layerGroup().addTo(map);
      }

      const map = mapInstanceRef.current;
      const markersLayer = markersLayerRef.current;
      const polylinesLayer = polylinesLayerRef.current;

      // Clear existing markers & polylines
      if (markersLayer) markersLayer.clearLayers();
      if (polylinesLayer) polylinesLayer.clearLayers();
      markersRef.current = {};
      polylinesRef.current = {};

      const validPlaces = places.filter(
        (p) => typeof p.lat === "number" && typeof p.lng === "number" && !isNaN(p.lat) && !isNaN(p.lng)
      );

      if (validPlaces.length === 0) return;

      const bounds = L.latLngBounds([]);
      const placesByDay: Record<number, Place[]> = {};

      // Draw Markers
      validPlaces.forEach((place, index) => {
        const dayNumber = place.assignedDay || 0;
        const color = getDayColor(dayNumber);
        const isSelected = place.id === selectedPlaceId;
        const isDimmed =
          highlightDay !== null &&
          highlightDay !== undefined &&
          dayNumber !== highlightDay;

        if (dayNumber > 0) {
          if (!placesByDay[dayNumber]) placesByDay[dayNumber] = [];
          placesByDay[dayNumber].push(place);
        }

        const markerHtml = `
          <div id="pin-${place.id}" class="${isSelected ? "active-pin-pulse" : ""}" style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isSelected ? "38px" : "32px"};
            height: ${isSelected ? "38px" : "32px"};
            background-color: ${color};
            color: #ffffff;
            font-weight: 800;
            font-size: ${isSelected ? "13px" : "11px"};
            font-family: var(--font-body, system-ui);
            border-radius: 50%;
            border: 2.5px solid #ffffff;
            box-shadow: 0 4px 14px rgba(0,0,0,0.28);
            opacity: ${isDimmed ? "0.35" : "1"};
            transform: ${isSelected ? "scale(1.15)" : "scale(1)"};
            transition: transform 0.2s ease, opacity 0.2s ease;
            cursor: pointer;
          ">
            ${dayNumber > 0 ? `D${dayNumber}` : index + 1}
          </div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: "ghoomo-custom-marker",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([place.lat, place.lng], {
          icon: customIcon,
          zIndexOffset: isSelected ? 1000 : 100,
        });

        const popupContent = `
          <div style="min-width: 200px; font-family: var(--font-body, system-ui); padding: 4px;">
            ${place.imageUrl ? `<img src="${place.imageUrl}" style="width: 100%; height: 95px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" />` : ""}
            <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 2px;">${place.name}</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">${place.city || ""}${place.state ? `, ${place.state}` : ""}</div>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; border-top: 1px solid #f1f5f9; padding-top: 6px;">
              <span style="background: ${color}20; color: ${color}; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
                ${dayNumber > 0 ? `Day ${dayNumber} (${place.timeSlot || "Day"})` : "Unassigned"}
              </span>
              <span style="color: #059669; font-weight: 700;">
                ${Math.round((place.confidence || 0.9) * 100)}% • How sure we are
              </span>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          className: "ghoomo-map-popup",
        });

        marker.on("click", () => {
          if (onSelectPlace) onSelectPlace(place.id);
        });

        marker.addTo(markersLayer);
        markersRef.current[place.id] = marker;
        bounds.extend([place.lat, place.lng]);
      });

      // Draw connecting route polylines for days with 2+ places
      Object.entries(placesByDay).forEach(([dayStr, dayPlaces]) => {
        const dayNum = Number(dayStr);
        if (dayPlaces.length >= 2) {
          const latlngs: L.LatLngTuple[] = dayPlaces.map(
            (p) => [p.lat, p.lng] as [number, number]
          );
          const routeColor = getDayColor(dayNum);
          const isRouteDimmed =
            highlightDay !== null &&
            highlightDay !== undefined &&
            dayNum !== highlightDay;

          const polyline = L.polyline(latlngs, {
            color: routeColor,
            weight: 3.5,
            dashArray: "6, 8",
            opacity: isRouteDimmed ? 0.2 : 0.85,
          }).addTo(polylinesLayer);

          polylinesRef.current[dayNum] = polyline;
        }
      });

      // Fit map viewport to encompass all places initially
      if (bounds.isValid() && !selectedPlaceId && highlightDay === null) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [places]);

  // 2. Smoothly zoom & center on selected place when selection changes (NO full re-render)
  useEffect(() => {
    if (!selectedPlaceId || !mapInstanceRef.current) return;

    const targetPlace = places.find((p) => p.id === selectedPlaceId);
    if (
      targetPlace &&
      typeof targetPlace.lat === "number" &&
      typeof targetPlace.lng === "number" &&
      !isNaN(targetPlace.lat) &&
      !isNaN(targetPlace.lng)
    ) {
      mapInstanceRef.current.flyTo([targetPlace.lat, targetPlace.lng], 16, {
        animate: true,
        duration: 1.0,
      });

      const marker = markersRef.current[selectedPlaceId];
      if (marker) {
        marker.openPopup();
        marker.setZIndexOffset(1000);
      }
    }
  }, [selectedPlaceId, places]);

  // 3. Highlight / Dim markers & zoom to day when highlightDay changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    import("leaflet").then((L) => {
      // Update marker opacities and polylines
      places.forEach((place) => {
        const marker = markersRef.current[place.id];
        if (!marker) return;

        const dayNumber = place.assignedDay || 0;
        const isSelected = place.id === selectedPlaceId;
        const isDimmed =
          highlightDay !== null &&
          highlightDay !== undefined &&
          dayNumber !== highlightDay;

        const el = marker.getElement();
        if (el) {
          el.style.opacity = isDimmed ? "0.25" : "1";
          el.style.transform = isSelected ? "scale(1.15)" : "scale(1)";
        }
      });

      // Update polyline opacities
      Object.entries(polylinesRef.current).forEach(([dayStr, polyline]) => {
        const dayNum = Number(dayStr);
        const isRouteDimmed =
          highlightDay !== null &&
          highlightDay !== undefined &&
          dayNum !== highlightDay;
        polyline.setStyle({
          opacity: isRouteDimmed ? 0.15 : 0.9,
          weight: highlightDay === dayNum ? 4.5 : 3.5,
        });
      });

      // Zoom to Day's places if a specific day is selected
      if (highlightDay !== null && highlightDay !== undefined) {
        const dayPlaces = places.filter(
          (p) =>
            p.assignedDay === highlightDay &&
            typeof p.lat === "number" &&
            typeof p.lng === "number" &&
            !isNaN(p.lat) &&
            !isNaN(p.lng)
        );

        if (dayPlaces.length === 1) {
          map.flyTo([dayPlaces[0].lat, dayPlaces[0].lng], 15, {
            animate: true,
            duration: 0.9,
          });
        } else if (dayPlaces.length > 1) {
          const dayBounds = L.latLngBounds(
            dayPlaces.map((p) => [p.lat, p.lng] as [number, number])
          );
          if (dayBounds.isValid()) {
            map.fitBounds(dayBounds, {
              padding: [50, 50],
              maxZoom: 15,
              animate: true,
            });
          }
        }
      } else if (!selectedPlaceId) {
        // Reset to full trip bounds
        const validPlaces = places.filter(
          (p) => typeof p.lat === "number" && typeof p.lng === "number"
        );
        if (validPlaces.length > 0) {
          const allBounds = L.latLngBounds(
            validPlaces.map((p) => [p.lat, p.lng] as [number, number])
          );
          if (allBounds.isValid()) {
            map.fitBounds(allBounds, {
              padding: [40, 40],
              maxZoom: 14,
              animate: true,
            });
          }
        }
      }
    });
  }, [highlightDay, selectedPlaceId, places]);

  // 4. ResizeObserver to keep map fluid and properly sized on tab changes
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative w-full h-full min-h-100 rounded-lg overflow-hidden border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 shadow-xs isolate z-0">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* DYNAMIC FLOATING DAY ROUTES LEGEND OVERLAY */}
      <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-md pointer-events-auto dark:bg-slate-950/90 dark:border-slate-800 min-w-44 max-w-64 transition-all duration-200">
        {/* Header with Title, All Days toggle, and Collapse/Expand */}
        <div className="p-2.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">
            <Layers size={13} className="text-teal-600 dark:text-teal-400" />
            <span>Day Routes</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onSelectDay && onSelectDay(null)}
              className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                highlightDay === null || highlightDay === undefined
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
              title="Show all days on map"
            >
              All
            </button>

            <button
              onClick={() => setIsLegendExpanded(!isLegendExpanded)}
              className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded cursor-pointer transition-colors"
              title={isLegendExpanded ? "Collapse legend" : "Expand legend"}
            >
              {isLegendExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

        {/* Dynamic Days List */}
        {isLegendExpanded && (
          <div className="p-2 max-h-56 overflow-y-auto space-y-1 text-[11px]">
            {Array.from({ length: totalDays }).map((_, i) => {
              const dayNum = i + 1;
              const count = placesCountByDay[dayNum] || 0;
              const color = getDayColor(dayNum);
              const isActive = highlightDay === dayNum;

              return (
                <div
                  key={`day-route-${dayNum}`}
                  onClick={() => onSelectDay && onSelectDay(isActive ? null : dayNum)}
                  className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-all duration-150 ${
                    isActive
                      ? "bg-teal-50/90 text-teal-900 font-bold ring-1 ring-teal-500/40 dark:bg-teal-950/60 dark:text-teal-200"
                      : "hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium">Day {dayNum}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-slate-400 dark:text-slate-500">
                      {count} {count === 1 ? "place" : "places"}
                    </span>
                    {isActive && <Check size={11} className="text-teal-600 dark:text-teal-400" />}
                  </div>
                </div>
              );
            })}

            {/* Unassigned row if any unassigned places exist */}
            {unassignedCount > 0 && (
              <div
                onClick={() => onSelectDay && onSelectDay(highlightDay === 0 ? null : 0)}
                className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-all duration-150 border-t border-slate-100 dark:border-slate-800/60 pt-1.5 mt-1 ${
                  highlightDay === 0
                    ? "bg-slate-100 text-slate-900 font-bold dark:bg-slate-800 dark:text-white"
                    : "hover:bg-slate-100 text-slate-500 dark:hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400 shrink-0" />
                  <span>Unassigned</span>
                </div>
                <span className="text-[10px] text-slate-400">{unassignedCount}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        .ghoomo-map-popup .leaflet-popup-content-wrapper {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          color: #0f172a;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.12);
        }
        .ghoomo-map-popup .leaflet-popup-tip {
          background: #ffffff;
        }
        .leaflet-container {
          background: #fafafa !important;
        }
      `}</style>
    </div>
  );
}
