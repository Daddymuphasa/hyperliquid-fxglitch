import QRCode from "qrcode";

export type TelegramQrLoginTicket = {
  qrDataUrl: string;
  loginUrl: string;
  expiresAt: Date;
  status: "pending";
};

export class TelegramUserLoginService {
  async createQrLoginTicket(): Promise<TelegramQrLoginTicket> {
    const loginUrl = this.createPlaceholderLoginUrl();

    return {
      qrDataUrl: await QRCode.toDataURL(loginUrl, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 320
      }),
      loginUrl,
      expiresAt: new Date(Date.now() + 30 * 1000),
      status: "pending"
    };
  }

  private createPlaceholderLoginUrl() {
    return "tg://login?token=telegram-mtproto-login-token-required";
  }
}
