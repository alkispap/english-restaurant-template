export type ConfirmedListingEntityResolution = {
  id: string;
  resolutionType: "source-alias" | "duplicate" | "moved" | "renamed";
  canonicalSlug: string;
  canonicalSourceId: string;
  aliasSlugs: readonly string[];
  aliasSourceIds: readonly string[];
  reviewedAt: string;
  reviewedBy: string;
  reason: string;
  evidence: readonly { sourceName: string; repositoryRef: string }[];
};

export const confirmedListingEntityResolutions = [
  {
    id: "entity-resolution-montys-nepalese-source-alias",
    resolutionType: "source-alias",
    canonicalSlug: "monty-s-nepalese-cuisine",
    canonicalSourceId: "ChIJLY76B5ANdkgR2lrh_0eC_k8",
    aliasSlugs: [],
    aliasSourceIds: ["ChIJuUWujUYNdkgRO_H-QCUjQ0o"],
    reviewedAt: "2026-07-16T00:00:00.000Z",
    reviewedBy: "directory-editor",
    reason: "A reviewed source-profile alias maps to the retained canonical restaurant location.",
    evidence: [{ sourceName: "Phase 5C entity-resolution record", repositoryRef: "AUDIT-IMPLEMENTATION-LOG.md#phase-5c" }]
  },
  {
    id: "entity-resolution-yummy-dosa-duplicate",
    resolutionType: "duplicate",
    canonicalSlug: "yummy-dosa",
    canonicalSourceId: "ChIJHW95Q7an2EcRTtMQy-XzTBg",
    aliasSlugs: ["yummy-dosa-catering"],
    aliasSourceIds: ["ChIJocOA2Stm2qoRoXP2Vrhu6T4"],
    reviewedAt: "2026-07-16T00:00:00.000Z",
    reviewedBy: "directory-editor",
    reason: "The catering profile was confirmed as a duplicate alias of the retained Yummy Dosa restaurant entity.",
    evidence: [{ sourceName: "Phase 5C entity-resolution record", repositoryRef: "AUDIT-IMPLEMENTATION-LOG.md#phase-5c" }]
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
