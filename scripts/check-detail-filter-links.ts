import { strict as assert } from "node:assert";
import { buildDetailFilterHref } from "../src/lib/listing-detail-filter-links";

assert.equal(
  buildDetailFilterHref("service", "Delivery", "Redbridge"),
  "/services/delivery",
  "Service links should prefer clean service hub URLs"
);

assert.equal(
  buildDetailFilterHref("highlight", "Great dessert", "Redbridge"),
  "/?area=redbridge&highlight=great-dessert",
  "Highlight links should include area and selected highlight"
);

assert.equal(
  buildDetailFilterHref("popularFor", "Solo dining", "Redbridge"),
  "/?area=redbridge&popularFor=solo-dining",
  "Popular-for links should include area and selected popular-for value"
);

assert.equal(
  buildDetailFilterHref("service", "Delivery"),
  "/services/delivery",
  "Links should still work when no area is available"
);

console.log("Detail filter link checks passed");
