export const LOCKED_LAYER_DELETE_MESSAGE =
  "This layer is locked and needs to be unlocked before deleting.";

export function warnIfLockedLayers(layers = []) {
  if (!layers.some((layer) => layer.locked)) return false;

  alert(LOCKED_LAYER_DELETE_MESSAGE);
  return true;
}
