/**
 * Objectionable-content filter for user-generated content (Apple App Review
 * guideline 1.2 requires one; Google Play's UGC policy expects one).
 *
 * Deliberately small and conservative: only slurs and severe profanity, matched
 * as WHOLE WORDS, case-insensitively. Substrings never match ("Scunthorpe",
 * "class", "assessment", "cocktail"), and words with common innocent meanings
 * ("chink in the armour", "spick and span", "dyke" as an embankment, "fag" as a
 * cigarette, "bitch" for a dog) are intentionally NOT listed — reports and
 * moderators handle context-dependent cases.
 *
 * The list lives only in this module; edit here and extend the unit tests.
 */

const BLOCKED_WORDS = [
  // severe profanity
  'fuck', 'fucks', 'fucked', 'fucker', 'fuckers', 'fucking', 'fuckin', 'fuckwit',
  'motherfucker', 'motherfuckers', 'motherfucking',
  'cunt', 'cunts',
  'asshole', 'assholes',
  'whore', 'whores', 'slut', 'sluts',
  // slurs
  'nigger', 'niggers', 'nigga', 'niggas',
  'faggot', 'faggots',
  'kike', 'kikes',
  'wetback', 'wetbacks',
  'tranny', 'trannies',
  'raghead', 'ragheads',
] as const;

const pattern = new RegExp(`\\b(?:${BLOCKED_WORDS.join('|')})\\b`, 'i');

export const OFFENSIVE_CONTENT_MESSAGE = 'Please remove offensive language before posting.';

/** True when any of the texts contains a blocked word (whole-word, case-insensitive). */
export function containsObjectionableContent(...texts: Array<string | null | undefined>): boolean {
  return texts.some((text) => typeof text === 'string' && pattern.test(text));
}

/** Throws a 422 with the standard message when any text matches. */
export function assertCleanContent(...texts: Array<string | null | undefined>): void {
  if (containsObjectionableContent(...texts)) {
    throw Object.assign(new Error(OFFENSIVE_CONTENT_MESSAGE), { statusCode: 422 });
  }
}
