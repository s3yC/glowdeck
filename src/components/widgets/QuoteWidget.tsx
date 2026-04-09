'use client';

import { useMemo } from 'react';
import type { WidgetProps } from '@/types';

/* ------------------------------------------------------------------ */
/*  Quote bank (50+ quotes)                                            */
/* ------------------------------------------------------------------ */
interface Quote {
  text: string;
  author: string;
}

const QUOTES: Quote[] = [
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
  { text: 'Stay hungry, stay foolish.', author: 'Steve Jobs' },
  { text: 'Life is what happens when you\'re busy making other plans.', author: 'John Lennon' },
  { text: 'The purpose of our lives is to be happy.', author: 'Dalai Lama' },
  { text: 'Get busy living or get busy dying.', author: 'Stephen King' },
  { text: 'You only live once, but if you do it right, once is enough.', author: 'Mae West' },
  { text: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein' },
  { text: 'Imagination is more important than knowledge.', author: 'Albert Einstein' },
  { text: 'The unexamined life is not worth living.', author: 'Socrates' },
  { text: 'The mind is everything. What you think you become.', author: 'Buddha' },
  { text: 'An unexamined life is not worth living.', author: 'Socrates' },
  { text: 'Eighty percent of success is showing up.', author: 'Woody Allen' },
  { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb' },
  { text: 'It is during our darkest moments that we must focus to see the light.', author: 'Aristotle' },
  { text: 'The only impossible journey is the one you never begin.', author: 'Tony Robbins' },
  { text: 'Everything you\'ve ever wanted is on the other side of fear.', author: 'George Addair' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { text: 'We suffer more often in imagination than in reality.', author: 'Seneca' },
  { text: 'No man is free who is not master of himself.', author: 'Epictetus' },
  { text: 'The happiness of your life depends upon the quality of your thoughts.', author: 'Marcus Aurelius' },
  { text: 'Waste no more time arguing about what a good man should be. Be one.', author: 'Marcus Aurelius' },
  { text: 'It is not death that a man should fear, but he should fear never beginning to live.', author: 'Marcus Aurelius' },
  { text: 'Difficulties strengthen the mind, as labor does the body.', author: 'Seneca' },
  { text: 'He who fears death will never do anything worthy of a living man.', author: 'Seneca' },
  { text: 'The whole future lies in uncertainty: live immediately.', author: 'Seneca' },
  { text: 'First say to yourself what you would be; and then do what you have to do.', author: 'Epictetus' },
  { text: 'Any person capable of angering you becomes your master.', author: 'Epictetus' },
  { text: 'The obstacle is the way.', author: 'Marcus Aurelius' },
  { text: 'You have power over your mind, not outside events. Realize this, and you will find strength.', author: 'Marcus Aurelius' },
  { text: 'Talk is cheap. Show me the code.', author: 'Linus Torvalds' },
  { text: 'Programs must be written for people to read, and only incidentally for machines to execute.', author: 'Harold Abelson' },
  { text: 'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.', author: 'Martin Fowler' },
  { text: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
  { text: 'The best error message is the one that never shows up.', author: 'Thomas Fuchs' },
  { text: 'Simplicity is the soul of efficiency.', author: 'Austin Freeman' },
  { text: 'Make it work, make it right, make it fast.', author: 'Kent Beck' },
  { text: 'Code is like humor. When you have to explain it, it\'s bad.', author: 'Cory House' },
  { text: 'The advance of technology is based on making it fit in so that you don\'t really even notice it.', author: 'Bill Gates' },
  { text: 'It always seems impossible until it\'s done.', author: 'Nelson Mandela' },
  { text: 'Be yourself; everyone else is already taken.', author: 'Oscar Wilde' },
  { text: 'Two things are infinite: the universe and human stupidity; and I\'m not sure about the universe.', author: 'Albert Einstein' },
  { text: 'Be the change that you wish to see in the world.', author: 'Mahatma Gandhi' },
  { text: 'Without music, life would be a mistake.', author: 'Friedrich Nietzsche' },
  { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Aristotle' },
  { text: 'The only true wisdom is in knowing you know nothing.', author: 'Socrates' },
  { text: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
  { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
  { text: 'Act as if what you do makes a difference. It does.', author: 'William James' },
  { text: 'What we achieve inwardly will change outer reality.', author: 'Plutarch' },
  { text: 'The best way to predict the future is to invent it.', author: 'Alan Kay' },
  { text: 'Perfection is not attainable, but if we chase perfection we can catch excellence.', author: 'Vince Lombardi' },
  { text: 'A ship in harbor is safe, but that is not what ships are built for.', author: 'John A. Shedd' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'What you do speaks so loudly that I cannot hear what you say.', author: 'Ralph Waldo Emerson' },
  { text: 'Nothing in life is to be feared, it is only to be understood.', author: 'Marie Curie' },
  { text: 'The greatest glory in living lies not in never falling, but in rising every time we fall.', author: 'Nelson Mandela' },
  { text: 'If you look at what you have in life, you\'ll always have more.', author: 'Oprah Winfrey' },
  { text: 'Life is really simple, but we insist on making it complicated.', author: 'Confucius' },
  { text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
];

/* ------------------------------------------------------------------ */
/*  Day-of-year based selection (deterministic, same quote all day)     */
/* ------------------------------------------------------------------ */
function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function QuoteWidget({ widget }: WidgetProps) {
  const quote = useMemo(() => {
    const dayIndex = getDayOfYear() % QUOTES.length;
    return QUOTES[dayIndex];
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-4 select-none text-center">
      {/* Opening quotation mark */}
      <span
        className="text-[clamp(1.5rem,4vw,3rem)] leading-none font-serif opacity-15 mb-1"
        style={{ color: 'var(--accent)' }}
      >
        {'\u201C'}
      </span>

      {/* Quote text */}
      <p
        className="text-[clamp(0.65rem,1.8vw,1.1rem)] font-light italic leading-relaxed max-w-prose"
        style={{ color: 'var(--text-primary)' }}
      >
        {quote.text}
      </p>

      {/* Thin divider */}
      <div
        className="w-6 h-[1px] my-3 rounded-full"
        style={{ background: 'var(--accent)', opacity: 0.3 }}
      />

      {/* Author */}
      <span
        className="text-[clamp(0.45rem,1.1vw,0.7rem)] font-medium tracking-wider uppercase opacity-45"
        style={{ color: 'var(--text-secondary)' }}
      >
        {quote.author}
      </span>
    </div>
  );
}
