import { Platform } from 'react-native';

/**
 * A handful of anonymous milestones, counted on the same GoatCounter
 * dashboard as visits: no cookies, no names, no ids, nothing about who did
 * it. Enough to see where new people stop (an invite opened but nobody
 * joined, say). Only the published site loads GoatCounter, so this does
 * nothing in development or the demo.
 */
export type Milestone = 'invite-opened' | 'signed-up' | 'joined-group' | 'book-lent' | 'passed-on';

type GoatCounter = {
  count?: (vars: { path: string; title?: string; event?: boolean }) => void;
};

export function countMilestone(milestone: Milestone, tries = 10): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return;
  }
  const counter = (window as unknown as { goatcounter?: GoatCounter }).goatcounter;
  if (counter?.count) {
    counter.count({ path: milestone, title: milestone, event: true });
    return;
  }
  // The counter's script loads after the app; wait a little for it.
  if (tries > 0 && document.querySelector('script[data-goatcounter]')) {
    setTimeout(() => countMilestone(milestone, tries - 1), 500);
  }
}
