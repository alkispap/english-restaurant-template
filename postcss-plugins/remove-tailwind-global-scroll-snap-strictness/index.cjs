module.exports = function removeTailwindGlobalScrollSnapStrictness() {
  return {
    postcssPlugin: "remove-tailwind-global-scroll-snap-strictness",
    OnceExit(root) {
      root.walkDecls("--tw-scroll-snap-strictness", (declaration) => {
        const parent = declaration.parent;
        if (parent?.type !== "rule") return;

        const selectorParts = parent.selector
          .split(",")
          .map((selectorPart) => selectorPart.trim().replace(/^::?/, ""));
        const targetsUniversalReset =
          selectorParts.includes("*") && selectorParts.includes("before") && selectorParts.includes("after");

        if (targetsUniversalReset) declaration.remove();
      });
    }
  };
};

module.exports.postcss = true;
