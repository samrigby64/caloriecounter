/** Light haptic tap. Uses the Vibration API where available (Android/Chrome);
 *  iOS Safari ignores it, but the paired CSS press-animation still gives the
 *  tactile feel. Safe to call anywhere. */
export function haptic(ms = 8): void {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* no-op */
  }
}
