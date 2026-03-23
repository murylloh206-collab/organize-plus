import "express-session";

declare module "express-session" {
  interface SessionData {
    userId: number;
    userRole: string;
    salaId: number | null;
    chaveValidada?: boolean;
    chaveId?: number;
  }
}

declare module "express" {
  interface Request {
    session: SessionData;
  }
}