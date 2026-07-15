export type ConfirmedListingEntityResolution = {
  canonicalSlug: string;
  canonicalSourceId: string;
  aliasSlugs: readonly string[];
  aliasSourceIds: readonly string[];
};

export const confirmedListingEntityResolutions = [
  {
    canonicalSlug: "monty-s-nepalese-cuisine",
    canonicalSourceId: "ChIJLY76B5ANdkgR2lrh_0eC_k8",
    aliasSlugs: [],
    aliasSourceIds: ["ChIJuUWujUYNdkgRO_H-QCUjQ0o"]
  },
  {
    canonicalSlug: "yummy-dosa",
    canonicalSourceId: "ChIJHW95Q7an2EcRTtMQy-XzTBg",
    aliasSlugs: ["yummy-dosa-catering"],
    aliasSourceIds: ["ChIJocOA2Stm2qoRoXP2Vrhu6T4"]
  }
] as const satisfies readonly ConfirmedListingEntityResolution[];

const canonicalSourceIdByAlias = new Map<string, string>(
  confirmedListingEntityResolutions.flatMap((resolution) =>
    resolution.aliasSourceIds.map((sourceId) => [sourceId, resolution.canonicalSourceId] as const)
  )
);

export function resolveListingEntitySourceId(sourceId: string) {
  return canonicalSourceIdByAlias.get(sourceId) ?? sourceId;
}
