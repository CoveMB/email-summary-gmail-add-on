import type { SocialToneAnalysis } from '../types/types';

export const defaultSocialToneSummary = 'No reliable social-tone analysis available.';
export const defaultSocialToneCaution =
  'Tone analysis is uncertain and should be reviewed cautiously.';

export const createDefaultSocialToneAnalysis = (): SocialToneAnalysis => ({
  apparentTone: [],
  cautions: [defaultSocialToneCaution],
  confidence: 'low',
  evidence: '',
  possibleSenderState: null,
  relationalStance: null,
  socialSignals: [],
  summary: defaultSocialToneSummary,
  urgencyOrPressure: 'unclear',
});
