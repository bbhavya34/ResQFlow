/**
 * Keeps each prototype screen's colocated title/description definition while
 * Next.js owns routing. The metadata is mirrored by the App Router wrappers.
 */
export function definePage(path: string) {
  return <T extends object>(definition: T): T & { path: string } =>
    Object.assign(definition, { path });
}
