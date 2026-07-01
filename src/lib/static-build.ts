export function shouldGenerateFullStaticParams() {
  return process.env.NEXT_STATIC_EXPORT === "1";
}
