import bcrypt from "bcrypt";
import type { Request, Response, NextFunction } from "express";
import "express-session";
import { supabaseAdmin } from "./db.js";

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

export async function carregarUsuarioSessao(req: Request, userId: number) {
  const { data: user, error } = await supabaseAdmin
    .from("usuarios")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !user) return false;

  req.session.userId = user.id;
  req.session.userRole = user.role;
  req.session.salaId = user.sala_id; // Coluna vem como sala_id no DB
  return true;
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
  const { data: registro, error } = await supabaseAdmin
    .from("chaves")
    .select("*")
    .eq("chave", chave)
    .single();

  if (error || !registro) return { valida: false, motivo: "Chave não encontrada" };
  if (!registro.ativa) return { valida: false, motivo: "Chave inativa ou já utilizada" };

  return { valida: true, registro, tipo: "premium" };
}