import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
// Service do google calendar sem BD Drizzle

// Configurações do OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// Interface para tokens do usuário
interface UserTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

// Mapa para armazenar tokens por usuário (em produção, use banco de dados)
const userTokens = new Map<number, UserTokens>();

// Gerar URL de autorização
export function getAuthUrl(userId: number): string {
  const scopes = ['https://www.googleapis.com/auth/calendar'];
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: userId.toString(),
    prompt: 'consent'
  });
}

// Trocar código por tokens
export async function getTokensFromCode(code: string, userId: number) {
  const { tokens } = await oauth2Client.getToken(code);
  
  userTokens.set(userId, {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token!,
    expiry_date: tokens.expiry_date!
  });
  
  return tokens;
}

// Criar evento no Google Calendar
export async function createCalendarEvent(
  userId: number,
  eventData: {
    titulo: string;
    descricao?: string;
    data: Date;
    local?: string;
  }
) {
  try {
    const tokens = userTokens.get(userId);
    if (!tokens) {
      throw new Error('Usuário não autorizado');
    }

    oauth2Client.setCredentials(tokens);

    // Verificar se token expirou e renovar
    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      userTokens.set(userId, {
        access_token: credentials.access_token!,
        refresh_token: credentials.refresh_token! || tokens.refresh_token,
        expiry_date: credentials.expiry_date!
      });
      oauth2Client.setCredentials(credentials);
    }

    // Criar evento no Google Calendar
    const event = {
      summary: eventData.titulo,
      description: eventData.descricao || '',
      location: eventData.local || '',
      start: {
        dateTime: eventData.data.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: new Date(eventData.data.getTime() + 60 * 60 * 1000).toISOString(), // 1 hora depois
        timeZone: 'America/Sao_Paulo',
      },
      reminders: {
        useDefault: true,
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao criar evento no Google Calendar:', error);
    throw error;
  }
}

// Atualizar evento no Google Calendar
export async function updateCalendarEvent(
  userId: number,
  eventId: string,
  eventData: {
    titulo: string;
    descricao?: string;
    data: Date;
    local?: string;
  }
) {
  try {
    const tokens = userTokens.get(userId);
    if (!tokens) {
      throw new Error('Usuário não autorizado');
    }

    oauth2Client.setCredentials(tokens);

    const event = {
      summary: eventData.titulo,
      description: eventData.descricao || '',
      location: eventData.local || '',
      start: {
        dateTime: eventData.data.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: new Date(eventData.data.getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: event,
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar evento no Google Calendar:', error);
    throw error;
  }
}

// Deletar evento do Google Calendar
export async function deleteCalendarEvent(userId: number, eventId: string) {
  try {
    const tokens = userTokens.get(userId);
    if (!tokens) {
      throw new Error('Usuário não autorizado');
    }

    oauth2Client.setCredentials(tokens);

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
  } catch (error) {
    console.error('Erro ao deletar evento no Google Calendar:', error);
    throw error;
  }
}

// Listar eventos do Google Calendar
export async function listCalendarEvents(userId: number, maxResults: number = 10) {
  try {
    const tokens = userTokens.get(userId);
    if (!tokens) {
      throw new Error('Usuário não autorizado');
    }

    oauth2Client.setCredentials(tokens);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items;
  } catch (error) {
    console.error('Erro ao listar eventos do Google Calendar:', error);
    throw error;
  }
}