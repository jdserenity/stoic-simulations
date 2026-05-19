/**
 * Dev config: edit exercises here. Rebuild or refresh dev server to apply.
 */
export type ExerciseField = {
  id: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
};

export type Exercise = {
  id: string;
  title: string;
  instructions: string;
  fields: ExerciseField[];
};

/** How many exercises are assigned each calendar day. */
export const DAILY_COUNT = 2;

export const EXERCISES: Exercise[] = [
  {
    id: 'plain-language',
    title: 'Plain Language',
    instructions: `Write down a description of an upsetting or problematic event in plain language. This can be something that happened today or recently, or an imagined event you'd like to meditate on.

Phrase things accurately, from a philosophical perspective, with studied indifference.

Plain language means:
• without exaggeration
• without identity language
• without emotional coloring
• without mind reading
• without future prediction`,
    fields: [
      { id: 'event', label: 'The event (as it happened)', multiline: true },
      { id: 'plain', label: 'Plain-language description', multiline: true, placeholder: 'Accurate, uncolored, no mind-reading…' },
    ],
  },
  {
    id: 'positive-opportunities',
    title: 'Positive Opportunities',
    instructions: `Once you've practiced plain language, follow the example of Paconius Aggripinus: look for positive opportunities in the same situation.`,
    fields: [
      { id: 'situation', label: 'Situation (brief)', multiline: true },
      { id: 'opportunities', label: 'Positive opportunities', multiline: true },
    ],
  },
  {
    id: 'what-would-he-do',
    title: 'What Would He Do',
    instructions: `Write how you could exercise strength of character and cope wisely. Ask how someone you admire might cope, or what they would advise.

Treat the event like a sparring partner—an opportunity to strengthen emotional resilience and coping skills.`,
    fields: [
      { id: 'event', label: 'The situation', multiline: true },
      { id: 'admired', label: 'Someone you admire (or their stance)' },
      { id: 'cope', label: 'How they might cope / what they would advise', multiline: true },
      { id: 'your-strength', label: 'How you can exercise strength of character', multiline: true },
    ],
  },
  {
    id: 'negative-visualization',
    title: 'Negative Visualization',
    instructions: `Think of something you have in your life currently, and practice imagining losing it.`,
    fields: [
      { id: 'possession', label: 'What you have' },
      { id: 'loss', label: 'Imagining its loss', multiline: true },
    ],
  },
  {
    id: 'stoic-observer',
    title: 'Stoic Observer',
    instructions: `Reflect on today with honest distance.`,
    fields: [
      { id: 'shortfall', label: 'Where did I fall short of the person I want to be today?', multiline: true },
      { id: 'tomorrow', label: 'What will I do differently tomorrow?', multiline: true },
    ],
  },
  {
    id: 'distortion-hunt',
    title: 'Cognitive Distortion Hunt',
    instructions: `Take a painful thought and dissect it.

Identify which distortions are present:
• catastrophizing?
• black-and-white thinking?
• selective attention?
• comparison distortion?
• emotional reasoning?
• fortune telling?

Rewrite the thought WITHOUT the distortions while preserving truth.

You are not replacing thoughts with positivity—you are replacing distortions with accuracy.`,
    fields: [
      { id: 'thought', label: 'Painful thought', placeholder: 'e.g. I\'m falling behind in life.' },
      { id: 'distortions', label: 'Distortions present', multiline: true },
      { id: 'rewrite', label: 'Rewrite without distortions (accurate)', multiline: true },
    ],
  },
  {
    id: 'envy-collaboration',
    title: 'Envy as Collaboration',
    instructions: `Think of someone you're envious of. Identify how they are directly or indirectly making your life better through their actions.

If relevant: note how what they have is not something you actually want, or does not align with your values.`,
    fields: [
      { id: 'person', label: 'Person' },
      { id: 'benefit', label: 'How their actions benefit you', multiline: true },
      { id: 'values', label: 'Misalignment with your values (if any)', multiline: true },
    ],
  },
  {
    id: 'adversity-training',
    title: 'Adversity to Training',
    instructions: `Condition the brain to reinterpret difficulty as developmental stimulus.

Take an insecurity, frustration, failure, delay, uncertainty, humiliation, loneliness, exhaustion, etc.

Answer: "What capacity does this situation give me the opportunity to train?"

Not fake positivity—functional reinterpretation.`,
    fields: [
      { id: 'adversity', label: 'The difficulty', multiline: true },
      { id: 'capacity', label: 'What capacity can I train?', multiline: true, placeholder: 'e.g. uncertainty → courage, stress tolerance' },
    ],
  },
  {
    id: 'others-hardship',
    title: 'People Are Going Through Hardship',
    instructions: `Think of someone you know: what hardship they may be facing, how it might affect their behavior, and how brave they are for carrying it.`,
    fields: [
      { id: 'person', label: 'Person' },
      { id: 'hardship', label: 'Hardship they may be facing', multiline: true },
      { id: 'behavior', label: 'How it might affect their behavior', multiline: true },
      { id: 'bravery', label: 'Their bravery', multiline: true },
    ],
  },
  {
    id: 'forgive',
    title: 'Forgive Someone',
    instructions: `Think of someone who has wronged you. Forgive them. Reason about why they did what they did—they are only human, far from perfect.`,
    fields: [
      { id: 'person', label: 'Person' },
      { id: 'wrong', label: 'What they did', multiline: true },
      { id: 'why', label: 'Why they may have done it', multiline: true },
      { id: 'forgiveness', label: 'Your forgiveness', multiline: true },
    ],
  },
  {
    id: 'control-boundary',
    title: 'Control Boundary Reminder',
    instructions: `List anything you spent time on recently that was not in your control, yet you let occupy your mind.`,
    fields: [
      { id: 'list', label: 'Not in my control, yet occupied my mind', multiline: true },
    ],
  },
  {
    id: 'identity-defusion',
    title: 'Identity De-Fusion',
    instructions: `Separate temporary states from identity.

Take a painful self-statement ("I'm lazy.", "I'm weak.", "I'm behind.") and rewrite it only in behavioral terms.

Identity language creates learned helplessness. Behavioral language creates leverage.`,
    fields: [
      { id: 'identity', label: 'Painful self-statement', placeholder: 'I\'m lazy.' },
      { id: 'behavioral', label: 'Behavioral rewrite', multiline: true, placeholder: 'I avoided difficult work for 4 hours because…' },
    ],
  },
  {
    id: 'perspective-shift',
    title: 'Voluntary Perspective Shift',
    instructions: `Take a painful situation and reinterpret it from each perspective below.

This trains: "My first interpretation is not the only interpretation."`,
    fields: [
      { id: 'situation', label: 'The situation', multiline: true },
      { id: 'yours', label: 'Your perspective', multiline: true },
      { id: 'mentor', label: "A mentor's perspective", multiline: true },
      { id: 'neutral', label: 'A neutral observer', multiline: true },
      { id: 'future', label: 'Your future self', multiline: true },
      { id: 'stronger', label: 'Someone stronger than you', multiline: true },
      { id: 'weaker', label: 'Someone weaker than you', multiline: true },
    ],
  },
  {
    id: 'and-yet',
    title: 'And Yet',
    instructions: `Complete statements like: "I feel behind, and yet…"

Examples:
• …I still have time.
• …I'm still capable of building something meaningful.
• …many successful people developed slowly.
• …my emotional state is distorting scale.

This restores dimensionality when stress collapses thought into a single narrative.`,
    fields: [
      { id: 'stem', label: 'Statement stem', placeholder: 'I feel behind, and yet…' },
      { id: 'completions', label: 'Completions (one per line)', multiline: true },
    ],
  },
];

export function exerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
