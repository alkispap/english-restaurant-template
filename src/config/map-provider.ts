export type MapProviderConfig = {
  tileUrl: string;
  attributionHtml: string;
  privacyPolicyUrl: string;
  tileUsagePolicyUrl: string;
  markerIconUrl: string;
  markerIconRetinaUrl: string;
  markerShadowUrl: string;
};

export const mapProviderConfig = {
  tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attributionHtml: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  privacyPolicyUrl: "https://osmfoundation.org/wiki/Privacy_Policy",
  tileUsagePolicyUrl: "https://operations.osmfoundation.org/policies/tiles/",
  markerIconUrl: "/vendor/leaflet/images/marker-icon.png",
  markerIconRetinaUrl: "/vendor/leaflet/images/marker-icon-2x.png",
  markerShadowUrl: "/vendor/leaflet/images/marker-shadow.png"
} as const satisfies MapProviderConfig;
