"use client";

import React, { useEffect, useRef } from "react";
import { Place } from "@/lib/types/ghoomo";
import "leaflet/dist/leaflet.css";

interface InteractiveMapProps {
  places: Place[];
  selectedPlaceId?: string | null;
  onSelectPlace?: (placeId: string) => void;
  highlightDay?: number | null;
}

const DAY_COLORS: Record<number, string> = {
  1: "#0d9488", // Teal 600
  2: "#0f766e", // Teal 700
  3: "#14b8a6", // Teal 500
  4: "#047857", // Emerald 700
  5: "#f97316", // Orange 500
};

export default function InteractiveMap({
  places,
  selectedPlaceId,
  onSelectPlace,
  highlightDay,
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const polylineLayerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet to avoid SSR window errors
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        // Default center: India (Jaipur / Central India)
        const initialLat = places.length > 0 ? places[0].lat : 26.9124;
        const initialLng = places.length > 0 ? places[0].lng : 75.7873;

        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: 12,
          zoomControl: false,
        });

        // CartoDB Light Matter tile layer
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          {
            attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
            maxZoom: 19,
            subdomains: "abcd",
          },
        ).addTo(map);

        L.control.zoom({ position: "bottomright" }).addTo(map);

        mapInstanceRef.current = map;
        polylineLayerRef.current = L.layerGroup().addTo(map);
      }

      const map = mapInstanceRef.current;
      const polylineGroup = polylineLayerRef.current;

      // Clear existing markers & polylines
      Object.values(markersRef.current).forEach((marker: any) =>
        marker.remove(),
      );
      markersRef.current = {};
      if (polylineGroup) polylineGroup.clearLayers();

      const validPlaces = places.filter(
        (p) => typeof p.lat === "number" && typeof p.lng === "number",
      );

      if (validPlaces.length === 0) return;

      const bounds = L.latLngBounds([]);

      // 1. Group places by day for route connecting polylines
      const placesByDay: Record<number, Place[]> = {};

      validPlaces.forEach((place, index) => {
        const dayNumber = place.assignedDay || 0;
        const color = DAY_COLORS[dayNumber] || "#0d9488";
        const isSelected = place.id === selectedPlaceId;
        const isDimmed =
          highlightDay !== null &&
          highlightDay !== undefined &&
          dayNumber !== highlightDay;

        if (dayNumber > 0) {
          if (!placesByDay[dayNumber]) placesByDay[dayNumber] = [];
          placesByDay[dayNumber].push(place);
        }

        const isActiveDay = highlightDay !== null && highlightDay !== undefined && dayNumber === highlightDay;
        const shouldPulse = isSelected || isActiveDay;

        // Custom Teal HTML Pin Marker with Day Badge
        const markerHtml = `
          <div class="${shouldPulse ? "active-pin-pulse" : ""}" style="
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
            box-shadow: 0 4px 14px rgba(13,148,136,0.35);
            opacity: ${isDimmed ? "0.35" : "1"};
            transform: ${isSelected ? "scale(1.15)" : "scale(1)"};
            transition: all 0.2s ease;
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
        }).addTo(map);

        // Interactive Light Popup
        const popupContent = `
          <div style="min-width: 190px; font-family: var(--font-body, system-ui); padding: 4px;">
            ${place.imageUrl ? `<img src="${place.imageUrl}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" />` : ""}
            <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 2px;">${place.name}</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">${place.city}, ${place.state}</div>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; border-top: 1px solid #f1f5f9; padding-top: 6px;">
              <span style="background: rgba(13, 148, 136, 0.12); color: #0d9488; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
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

        markersRef.current[place.id] = marker;
        bounds.extend([place.lat, place.lng]);
      });

      // 2. Draw route lines for days with 2+ places
      Object.entries(placesByDay).forEach(([dayStr, dayPlaces]) => {
        const dayNum = Number(dayStr);
        if (dayPlaces.length >= 2) {
          const latlngs: L.LatLngTuple[] = dayPlaces.map(
            (p) => [p.lat, p.lng] as [number, number],
          );
          const routeColor = DAY_COLORS[dayNum] || "#0d9488";
          const isRouteDimmed =
            highlightDay !== null &&
            highlightDay !== undefined &&
            dayNum !== highlightDay;

          L.polyline(latlngs, {
            color: routeColor,
            weight: 3.5,
            dashArray: "6, 8",
            opacity: isRouteDimmed ? 0.2 : 0.85,
          }).addTo(polylineGroup);
        }
      });

      // Fit map viewport to include all markers
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [places, selectedPlaceId, highlightDay, onSelectPlace]);

  // Center on selected place when selection changes
  useEffect(() => {
    if (
      !selectedPlaceId ||
      !mapInstanceRef.current ||
      !markersRef.current[selectedPlaceId]
    )
      return;
    const targetPlace = places.find((p) => p.id === selectedPlaceId);
    if (targetPlace && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([targetPlace.lat, targetPlace.lng], {
        animate: true,
      });
      markersRef.current[selectedPlaceId].openPopup();
    }
  }, [selectedPlaceId, places]);

  return (
    <div className="relative w-full h-full min-h-100 rounded-lg overflow-hidden border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 shadow-xs">
      <div ref={mapContainerRef} className="w-full h-full" />
      <style jsx global>{`
        .ghoomo-map-popup .leaflet-popup-content-wrapper {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          color: #0f172a;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08);
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
