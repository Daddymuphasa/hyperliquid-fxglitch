import type { ConsentGrant, OnboardingSession, ParsedTradeSignal, UserAccount } from "../types.js";

export class InMemoryStore {
  private readonly sessions = new Map<string, OnboardingSession>();
  private readonly users = new Map<string, UserAccount>();
  private readonly consents = new Map<string, ConsentGrant>();
  private readonly tradeSignals = new Map<string, ParsedTradeSignal>();

  saveSession(session: OnboardingSession) {
    this.sessions.set(session.id, session);
    return session;
  }

  updateSession(id: string, patch: Partial<OnboardingSession>) {
    const session = this.sessions.get(id);

    if (!session) {
      return undefined;
    }

    const next = { ...session, ...patch };
    this.sessions.set(id, next);
    return next;
  }

  getSession(id: string) {
    return this.sessions.get(id);
  }

  saveUser(user: UserAccount) {
    this.users.set(user.id, user);
    return user;
  }

  getUser(id: string) {
    return this.users.get(id);
  }

  findUserByWhatsAppId(whatsAppId: string) {
    return [...this.users.values()].find((user) => user.whatsAppId === whatsAppId);
  }

  saveConsent(consent: ConsentGrant) {
    this.consents.set(consent.userId, consent);
    return consent;
  }

  getConsentForUser(userId: string) {
    return this.consents.get(userId);
  }

  saveTradeSignal(signal: ParsedTradeSignal) {
    this.tradeSignals.set(signal.id, signal);
    return signal;
  }

  listTradeSignals() {
    return [...this.tradeSignals.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getTradeSignal(id: string) {
    return this.tradeSignals.get(id);
  }
}
