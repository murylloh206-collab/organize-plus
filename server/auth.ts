import bcrypt from "bcrypt";
import { db } from "./db.js";
import { usuarios, chaves, salas } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    userId: number;
    userRole: string;
    salaId: number | null;
    chaveValidada?: boolean;
    chaveId?: number;
  }
}

export async function hashSenha(senha: string) {
  return bcrypt.hash(senha, 12);
}

export async function verificarSenha(senha: string, hash: string) {
  return bcrypt.compare(senha, hash);
}

// Função para carregar dados do usuário na sessão
export async function carregarUsuarioSessao(req: Request, userId: number) {
  const [user] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.id, userId))
    .limit(1);
  
  if (user) {
    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.salaId = user.salaId;
    return true;
  }
  return false;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Não autorizado" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Não autorizado" });
  }
  if (req.session.userRole !== "admin") {
    return res.status(403).json({ message: "Acesso negado: somente admin" });
  }
  next();
}

export async function validarChave(chave: string) {
  const [registro] = await db
    .select()
    .from(chaves)
    .where(eq(chaves.chave, chave))
    .limit(1);

  if (!registro) return { valida: false, motivo: "Chave não encontrada" };
  if (!registro.ativa) return { valida: false, motivo: "Chave inativa ou já utilizada" };

  return { valida: true, registro, tipo: "premium" };
}