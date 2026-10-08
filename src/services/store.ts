import type { ConsentGrant, OnboardingSession, UserAccount } from "../types.js";

export class InMemoryStore {
  private readonly sessions = new Map<string, OnboardingSession>();
  private readonly users = new Map<string, UserAccount>();
  private readonly consents = new Map<string, ConsentGrant>();

  saveSession(session: OnboardingSession) {
    this.sessions.set(session.id, session);
    return session;
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
}
