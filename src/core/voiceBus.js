/**
 * vnova-engine — core/voiceBus.js
 *
 * Tiny shared reactive state for voice playback. The audio player updates it
 * and the auto-advance logic reads it, so auto mode can wait for the current
 * voice line to finish without coupling the engine to a specific player.
 */

import { ref } from 'vue'

export const voicePlaying = ref(false)
export const voiceTrack = ref(null)
export const voiceDuration = ref(0)

let currentToken = 0

/**
 * Marks a new voice line as playing.
 * @returns {number} token for later updates / end notifications
 */
export function beginVoice(track, duration = 0) {
  currentToken += 1
  voicePlaying.value = true
  voiceTrack.value = track ?? null
  voiceDuration.value = Number.isFinite(Number(duration)) ? Number(duration) : 0
  return currentToken
}

export function updateVoiceDuration(token, duration) {
  if (token !== currentToken) return
  voiceDuration.value = Number.isFinite(Number(duration)) ? Number(duration) : 0
}

export function endVoice(token) {
  if (token !== currentToken) return
  voicePlaying.value = false
  voiceTrack.value = null
  voiceDuration.value = 0
}

export function stopVoiceState() {
  currentToken += 1
  voicePlaying.value = false
  voiceTrack.value = null
  voiceDuration.value = 0
}

export function isVoiceToken(token) {
  return token === currentToken
}
