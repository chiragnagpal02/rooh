export const prompts = {
  story: [
    "What is your favourite memory of a festival from your childhood? What made it special?",
    "Tell me about the house you grew up in. What did it look like? What do you remember most?",
    "How did you meet Papa / Amma? What was your first impression?",
    "What was your favourite subject in school, and why?",
    "Tell me about your parents — what were they like?",
    "What was the hardest thing you ever went through? How did you get through it?",
    "What is a tradition from your childhood that you wish we had kept?",
    "Tell me about a teacher or person who shaped who you are.",
    "What did you dream of becoming when you were young?",
    "What is the most beautiful place you have ever been to?"
  ],
  practical: [
    "Can you tell me about any insurance policies you have? Just speak naturally — the company name, where the documents are, anything you remember.",
    "Tell me about your bank accounts — which banks, which branches, anything important I should know.",
    "Who is your main doctor, and are there any specialist doctors you see regularly?",
    "What medicines do you take every day? Just list them out for me.",
    "Tell me about any property — the house, any land — where the documents are kept.",
    "Who are the most important people I should contact if something ever happened? Names and numbers."
  ],
  legacy: [
    "Is there anything you have always wanted to tell me but never found the right moment?",
    "What values do you most want to pass on to your grandchildren?",
    "What do you want people to remember about you?",
    "Is there a message you would like to leave for the family — something for us to hold on to?"
  ]
}

export function getNextPrompt(
  category: 'story' | 'practical' | 'legacy',
  usedPrompts: string[]
): string {
  const available = prompts[category].filter(p => !usedPrompts.includes(p))
  // If all used, reset and start again
  const pool = available.length > 0 ? available : prompts[category]
  return pool[Math.floor(Math.random() * pool.length)]
}