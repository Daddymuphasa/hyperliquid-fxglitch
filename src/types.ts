export type OnboardingSession = {
  id: string;
  whatsAppId: string;
  status: "created" | "wallet_connected" | "agent_prepared" | "agent_approved" | "expired";
  createdAt: Date;
  expiresAt: Date;
  walletAddress?: string;
  agentAddress?: string;
  agentName?: string;
  approvalNonce?: number;
};

export type UserAccount = {
  id: string;
  whatsAppId: string;
  walletAddress: string;
  hyperliquidAccountAddress: string;
  agentAddress?: string;
  agentPrivateKeyCiphertext?: string;
  agentName?: string;
  approvalStatus: "prepared" | "approved";
  createdAt: Date;
};

export type ConsentGrant = {
  userId: string;
  status: "active" | "revoked";
  scopes: Array<"place_order" | "cancel_order" | "read_account">;
  riskLimits: {
    maxOrderSize: number;
    maxDailyNotional: number;
  };
  grantedAt: Date;
  expiresAt?: Date;
};

export type TradeRequest = {
  userId: string;
  asset: number;
  isBuy: boolean;
  size: number;
  limitPrice: number;
  reduceOnly: boolean;
  clientOrderId?: string;
};
