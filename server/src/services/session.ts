// POS session logic — auto-opens on login (Checkpoint 1)

import { PosSession } from '../models/PosSession.js';

function generateSessionNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SES-${date}-${time}-${ms}-${rand}`;
}

export async function openPosSession(userId: string) {
  const lastSession = await PosSession.findOne({ userId, status: 'CLOSED' })
    .sort({ closedAt: -1 });

  return PosSession.create({
    sessionNumber: generateSessionNumber(),
    userId,
    lastClosingSale: lastSession?.closingBalance ?? 0,
  });
}

export async function getActiveSession(userId: string) {
  return PosSession.findOne({ userId, status: 'OPEN' }).sort({ openedAt: -1 });
}