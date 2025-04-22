import { Context as BaseContext, SessionFlavor } from 'grammy';

interface SessionData {
  referralCode: string | null;
}

export type Context = BaseContext & SessionFlavor<SessionData>;