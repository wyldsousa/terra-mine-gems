import type { LandRentGoal } from '@/data/landRent';
/** Projection only; no wallet or actual payment is inferred. */
export function landRentGoalProgress(goal: LandRentGoal, daily: number, now = new Date()) {
  const start = new Date(goal.startedAt).getTime();
  const elapsed = Math.max(0, (now.getTime() - start) / 86400000);
  const estimated = elapsed * daily;
  const remaining = Math.max(0, goal.target - estimated);
  const days = daily > 0 ? remaining / daily : null;
  const finishMs = days === null ? NaN : now.getTime() + days * 86400000;
  const finish = Number.isFinite(finishMs) && Math.abs(finishMs) <= 8640000000000000 ? new Date(finishMs) : null;
  const deadline = goal.targetDate ? new Date(`${goal.targetDate}T23:59:59`) : null;
  return { estimated, remaining, progress: Math.min(100, estimated / goal.target * 100), days, finish, onTime: finish && deadline ? finish <= deadline : null };
}
