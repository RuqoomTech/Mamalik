import type { Locale } from "@/i18n/config";
import { ar } from "@/i18n/messages/ar";
import { en, type Messages } from "@/i18n/messages/en";

export type { Messages } from "@/i18n/messages/en";

// Everything except long public-page copy, which only server components need.
export type ClientMessages = Omit<Messages, "marketing">;

const dictionaries: Record<Locale, Messages> = { en, ar };

export function getMessagesFor(locale: Locale): Messages {
  return dictionaries[locale];
}

export function toClientMessages(messages: Messages): ClientMessages {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { marketing, ...clientMessages } = messages;

  return clientMessages;
}
