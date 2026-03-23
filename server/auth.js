import bcrypt from "bcrypt";
import { db } from "./db.js";
import { usuarios, chaves } from "../shared/schema.js";
import { eq } from "drizzle-orm";
export async function hashSenha(senha) {
    return bcrypt.hash(senha, 12);
}
export async function verificarSenha(senha, hash) {
    return bcrypt.compare(senha, hash);
}
// Função para carregar dados do usuário na sessão
export async function carregarUsuarioSessao(req, userId) {
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
export function requireAuth(req, res, next) {
    if (!req.session?.userId) {
        return res.status(401).json({ message: "Não autorizado" });
    }
    next();
}
export function requireAdmin(req, res, next) {
    if (!req.session?.userId) {
        return res.status(401).json({ message: "Não autorizado" });
    }
    if (req.session.userRole !== "admin") {
        return res.status(403).json({ message: "Acesso negado: somente admin" });
    }
    next();
}
export async function validarChave(chave) {
    const [registro] = await db
        .select()
        .from(chaves)
        .where(eq(chaves.chave, chave))
        .limit(1);
    if (!registro)
        return { valida: false, motivo: "Chave não encontrada" };
    if (!registro.ativa)
        return { valida: false, motivo: "Chave inativa ou já utilizada" };
    return { valida: true, registro, tipo: "premium" };
}
