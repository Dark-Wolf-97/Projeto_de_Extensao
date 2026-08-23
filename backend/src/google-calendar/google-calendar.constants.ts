import { google, type calendar_v3 } from 'googleapis';

export const GOOGLE_CALENDAR_CLIENT_FACTORY = Symbol(
  'GOOGLE_CALENDAR_CLIENT_FACTORY',
);

export interface GoogleCalendarClient {
  events: {
    insert(
      params: calendar_v3.Params$Resource$Events$Insert,
    ): Promise<{ data: calendar_v3.Schema$Event }>;
    update(
      params: calendar_v3.Params$Resource$Events$Update,
    ): Promise<{ data: calendar_v3.Schema$Event }>;
    delete(params: calendar_v3.Params$Resource$Events$Delete): Promise<unknown>;
  };
}

export interface GoogleCalendarClientConfig {
  serviceAccountEmail: string;
  serviceAccountPrivateKey: string;
}

export type GoogleCalendarClientFactory = (
  config: GoogleCalendarClientConfig,
) => GoogleCalendarClient;

export const googleCalendarClientFactory: GoogleCalendarClientFactory = ({
  serviceAccountEmail,
  serviceAccountPrivateKey,
}) => {
  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: serviceAccountPrivateKey,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
};
