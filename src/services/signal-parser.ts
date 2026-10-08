import { nanoid } from "nanoid";
import type { ParsedTradeSignal, SignalDirection } from "../types.js";

const symbolPattern = /\b([A-Z]{2,12})(?:\/?USDC|\/?USDT|USD)?\b/;
const entryPattern = /\b(?:entry|enter|buy|sell)\s*[:@]?\s*\$?([0-9]+(?:\.[0-9]+)?)/i;
const stopPattern = /\b(?:sl|stop|stoploss|stop loss)\s*[:@]?\s*\$?([0-9]+(?:\.[0-9]+)?)/i;
const takeProfitPattern = /\b(?:tp|take profit|target)\s*[:@]?\s*\$?([0-9]+(?:\.[0-9]+)?)/i;

export type TelegramSignalInput = {
  chatId: string;
  messageId: string;
  text: string;
};

export class SignalParser {
  parseTelegramSignal(input: TelegramSignalInput): ParsedTradeSignal {
    const text = input.text.trim();
    const direction = inferDirection(text);
    const symbol = inferSymbol(text);
    const entryPrice = readNumber(text, entryPattern);
    const stopLoss = readNumber(text, stopPattern);
    const takeProfit = readNumber(text, takeProfitPattern);
    const reasons: string[] = [];

    if (!symbol) {
      reasons.push("No supported trading symbol found.");
    }

    if (!direction) {
      reasons.push("No long or short direction found.");
    }

    if (!entryPrice) {
      reasons.push("No entry price found.");
    }

    if (!stopLoss) {
      reasons.push("No stop loss found.");
    }

    if (!takeProfit) {
      reasons.push("No take profit found.");
    }

    const confidence = scoreConfidence(Boolean(symbol), Boolean(direction), Boolean(entryPrice), Boolean(stopLoss), Boolean(takeProfit));
    const status = confidence >= 0.9 ? "ready" : confidence >= 0.5 ? "needs_review" : "rejected";

    return {
      id: nanoid(18),
      source: "telegram",
      sourceChatId: input.chatId,
      sourceMessageId: input.messageId,
      rawText: text,
      symbol: symbol ?? "UNKNOWN",
      direction: direction ?? "long",
      entryPrice,
      stopLoss,
      takeProfit,
      confidence,
      status,
      reasons,
      createdAt: new Date()
    };
  }
}

function inferDirection(text: string): SignalDirection | undefined {
  if (/\b(long|buy)\b/i.test(text)) {
    return "long";
  }

  if (/\b(short|sell)\b/i.test(text)) {
    return "short";
  }

  return undefined;
}

function inferSymbol(text: string) {
  const match = symbolPattern.exec(text.toUpperCase());
  const symbol = match?.[1];

  if (!symbol || ["LONG", "SHORT", "BUY", "SELL", "ENTRY", "STOP", "TARGET"].includes(symbol)) {
    return undefined;
  }

  return symbol;
}

function readNumber(text: string, pattern: RegExp) {
  const value = pattern.exec(text)?.[1];
  return value ? Number(value) : undefined;
}

function scoreConfidence(...checks: boolean[]) {
  const matched = checks.filter(Boolean).length;
  return matched / checks.length;
}
