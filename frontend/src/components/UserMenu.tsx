import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2, LogOut, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import i18n from "../i18n";

interface DetectedLocation {
  label: string;
  latitude: number;
  longitude: number;
}

const LOCATION_CACHE_KEY = "draftlex_detected_location";

function getCachedLocation(): DetectedLocation | null {
  try {
    const value = sessionStorage.getItem(LOCATION_CACHE_KEY);
    if (!value) return null;

    const parsed = JSON.parse(value) as DetectedLocation;

    if (
      typeof parsed?.label === "string" &&
      typeof parsed?.latitude === "number" &&
      typeof parsed?.longitude === "number"
    ) {
      return parsed;
    }
  } catch {
    // Ignore invalid session data.
  }

  return null;
}

function cacheLocation(location: DetectedLocation) {
  try {
    sessionStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location));
  } catch {
    // Session storage may be unavailable; location still works for this render.
  }
}

async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", latitude.toString());
  url.searchParams.set("lon", longitude.toString());
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "en");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed: ${response.status}`);
  }

  const data = await response.json();
  const address = data?.address ?? {};

  const city =
    address.city ??
    address.town ??
    address.municipality ??
    address.village ??
    address.county;

  const state = address.state;
  const country = address.country;

  const parts = [city, state].filter(
    (part): part is string => typeof part === "string" && part.trim().length > 0,
  );

  if (parts.length > 0) {
    return parts.join(", ");
  }

  if (typeof country === "string" && country.trim()) {
    return country;
  }

  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export default function UserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const [, setLang] = useState(i18n.language);
  const [location, setLocation] = useState<DetectedLocation | null>(
    getCachedLocation,
  );
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const locationRequestRef = useRef(false);

  const displayName = user?.email
    ? user.email.split("@")[0].replace(/^./, (c) => c.toUpperCase())
    : "Advocate";

  useEffect(() => {
    const onChange = (lng: string) => setLang(lng);

    i18n.on("languageChanged", onChange);

    return () => {
      i18n.off("languageChanged", onChange);
    };
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!open || location || locationRequestRef.current) return;

    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }

    locationRequestRef.current = true;
    setLocationLoading(true);
    setLocationError(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const label = await reverseGeocode(latitude, longitude);
          const detected: DetectedLocation = {
            label,
            latitude,
            longitude,
          };

          setLocation(detected);
          cacheLocation(detected);
        } catch (error) {
          console.error("Location reverse geocoding failed:", error);

          // Still show a useful location when reverse geocoding is unavailable.
          const detected: DetectedLocation = {
            label: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            latitude,
            longitude,
          };

          setLocation(detected);
          cacheLocation(detected);
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.warn("Location detection unavailable:", error.message);
        setLocationLoading(false);
        setLocationError(true);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      },
    );
  }, [open, location]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const openLocationInMaps = () => {
    if (!location) return;

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${location.latitude},${location.longitude}`,
    )}`;

    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  };

  const hindi = i18n.language.startsWith("hi");

  return (
    <div className="relative" ref={menuRef}>
      {/* Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm hover:bg-slate-50"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
          {displayName.charAt(0)}
        </div>

        <div className="text-left">
          <p className="font-semibold text-slate-900">{displayName}</p>
          <p className="text-sm text-slate-500">
            {hindi ? "अधिवक्ता" : "Advocate"}
          </p>
        </div>

        <ChevronDown
          size={18}
          className={`text-slate-500 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="p-5">
            <h3 className="text-xl font-semibold text-slate-900">
              {displayName}
            </h3>

            <p className="mt-1 text-slate-500">{user?.email}</p>

            <span className="mt-4 inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              {hindi ? "अधिवक्ता" : "Advocate"}
            </span>

            {/* Auto-detected location */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-white p-2 text-blue-600 shadow-sm">
                  <MapPin size={17} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {hindi ? "वर्तमान स्थान" : "Current location"}
                  </p>

                  {locationLoading ? (
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 size={14} className="animate-spin" />
                      {hindi ? "स्थान पता किया जा रहा है..." : "Detecting location..."}
                    </div>
                  ) : location ? (
                    <button
                      type="button"
                      onClick={openLocationInMaps}
                      className="mt-1 block max-w-full text-left text-sm font-medium text-slate-700 hover:text-blue-600"
                      title={
                        hindi
                          ? "Google Maps में स्थान खोलें"
                          : "Open location in Google Maps"
                      }
                    >
                      <span className="block truncate">{location.label}</span>
                      <span className="mt-0.5 block text-xs font-normal text-slate-400">
                        {hindi ? "मानचित्र में खोलें" : "Open in Maps"}
                      </span>
                    </button>
                  ) : locationError ? (
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {hindi
                        ? "स्थान की अनुमति नहीं मिली। ब्राउज़र की Location permission सक्षम करें।"
                        : "Location permission is unavailable. Enable Location permission in your browser."}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">
                      {hindi ? "स्थान उपलब्ध नहीं है" : "Location unavailable"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-5 py-4 text-left text-red-600 hover:bg-red-50"
            >
              <LogOut size={20} />
              {hindi ? "साइन आउट" : "Sign Out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
