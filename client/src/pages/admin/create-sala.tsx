import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, queryClient } from "../../lib/queryClient";

export default function CreateSalaPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Chave de acesso
  const [chaveAcesso, setChaveAcesso] = useState("");
  const [chaveValidada, setChaveValidada] = useState(false);
  const [validandoChave, setValidandoChave] = useState(false);
  const [erroChave, setErroChave] = useState("");

  // Campos da turma
  const [nomeTurma, setNomeTurma] = useState("");
  const [escola, setEscola] = useState("");
  const [ano, setAno] = useState(new Date().getFullYear().toString());
  const [metaTotal, setMetaTotal] = useState("");

  // Senha da turma
  const [senhaTurma, setSenhaTurma] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleValidarChave = async () => {
    if (!chaveAcesso.trim()) {
      setErroChave("Digite a chave de acesso.");
      return;
    }
    setValidandoChave(true);
    setErroChave("");
    try {
      await apiRequest("POST", "/auth/validate-chave", { chave: chaveAcesso.trim() });
      setChaveValidada(true);
    } catch (err: any) {
      setErroChave(err.message || "Chave inválida ou já utilizada.");
    } finally {
      setValidandoChave(false);
    }
  };

  // Cálculo de força da senha
  const calcularForca = (s: string) => {
    let score = 0;
    if (s.length >= 8) score++;
    if (/[A-Z]/.test(s)) score++;
    if (/[a-z]/.test(s)) score++;
    if (/[0-9]/.test(s)) score++;
    if (/[^A-Za-z0-9]/.test(s)) score++;
    return score;
  };

  const forca = calcularForca(senhaTurma);

  const requisitos = [
    { label: "Mínimo 8 caracteres", ok: senhaTurma.length >= 8 },
    { label: "Letra maiúscula", ok: /[A-Z]/.test(senhaTurma) },
    { label: "Letra minúscula", ok: /[a-z]/.test(senhaTurma) },
    { label: "Número", ok: /[0-9]/.test(senhaTurma) },
    { label: "Caractere especial", ok: /[^A-Za-z0-9]/.test(senhaTurma) },
  ];

  const getCorBarra = () => {
    if (forca <= 2) return "#ef4444";
    if (forca <= 3) return "#f59e0b";
    return "#22c55e";
  };

  const getTextoForca = () => {
    if (forca <= 2) return "Fraca";
    if (forca <= 3) return "Média";
    return "Forte";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!chaveValidada) {
      setError("Valide sua chave de acesso antes de criar a turma.");
      return;
    }

    if (senhaTurma !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }
    if (forca < 3) {
      setError("Por favor, escolha uma senha mais forte para a turma.");
      return;
    }

    setLoading(true);
    try {
      const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
      const dataFormatura = `${ano}-12-01`;

      const sala = await apiRequest("POST", "/salas", {
        nome: nomeTurma,
        escola,
        ano: parseInt(ano),
        metaTotal: parseFloat(metaTotal) || 0,
        senha: senhaTurma,
        codigo,
        dataFormatura,
        chaveUsada: chaveAcesso, // Guarda qual chave foi usada (opcional)
      });

      await queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      navigate("/admin/dashboard");
    } catch (err: any) {
      console.error("Erro ao criar turma:", err);
      setError(err.message || "Erro ao criar a turma. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Left Panel */}
      <div
        style={{
          width: "42%",
          background: "linear-gradient(160deg, #1e3a5f 0%, #0f2240 100%)",
          padding: "3rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
        className="hidden md:flex"
      >
        {/* Decorative circles */}
        <div style={{
          position: "absolute", width: "350px", height: "350px",
          borderRadius: "50%", border: "1px solid rgba(198,164,63,0.15)",
          top: "-80px", right: "-80px",
        }} />
        <div style={{
          position: "absolute", width: "250px", height: "250px",
          borderRadius: "50%", border: "1px solid rgba(198,164,63,0.1)",
          bottom: "100px", left: "-70px",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "3rem" }}>
            <div style={{
              width: "44px", height: "44px",
              background: "#c6a43f",
              borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 15px rgba(198,164,63,0.4)",
            }}>
              <span className="material-symbols-outlined" style={{ color: "#fff", fontSize: "22px" }}>layers</span>
            </div>
            <span style={{ color: "#fff", fontSize: "22px", fontWeight: 700 }}>Organize+</span>
          </div>

          <h2 style={{ color: "#fff", fontSize: "2.2rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "1rem" }}>
            Configure sua turma de formatura
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem", lineHeight: 1.6 }}>
            Defina as informações da sua turma. A senha criada aqui será usada pelos alunos para entrar na plataforma.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {[
            { icon: "group", text: "Gerencie todos os alunos da turma" },
            { icon: "payments", text: "Controle financeiro em tempo real" },
            { icon: "event", text: "Planeje eventos e datas importantes" },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "14px",
              marginBottom: "1.2rem",
            }}>
              <div style={{
                width: "36px", height: "36px",
                background: "rgba(198,164,63,0.15)",
                border: "1px solid rgba(198,164,63,0.3)",
                borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <span className="material-symbols-outlined" style={{ color: "#c6a43f", fontSize: "18px" }}>{item.icon}</span>
              </div>
              <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.9rem" }}>{item.text}</span>
            </div>
          ))}
        </div>

        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", position: "relative", zIndex: 1 }}>
          © 2026 Organize+ Plataforma de Formaturas
        </p>
      </div>

      {/* Right Panel */}
      <div style={{
        flex: 1,
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        overflowY: "auto",
      }}>
        <div style={{ width: "100%", maxWidth: "480px" }}>
          {/* Mobile logo */}
          <div className="flex md:hidden" style={{
            alignItems: "center", gap: "10px", marginBottom: "2rem",
          }}>
            <div style={{
              width: "36px", height: "36px", background: "#1e3a5f",
              borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span className="material-symbols-outlined" style={{ color: "#c6a43f", fontSize: "18px" }}>layers</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: "1.2rem", color: "#1e3a5f" }}>Organize+</span>
          </div>

          {/* Header */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(30,58,95,0.08)", borderRadius: "20px",
              padding: "6px 14px", marginBottom: "1rem",
            }}>
              <span className="material-symbols-outlined" style={{ color: "#1e3a5f", fontSize: "16px" }}>school</span>
              <span style={{ color: "#1e3a5f", fontSize: "0.8rem", fontWeight: 600 }}>Passo 2 de 2</span>
            </div>
            <h1 style={{ color: "#1e3a5f", fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.4rem" }}>
              Criar sua Turma
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
              Preencha os dados abaixo para configurar a turma de formatura.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Card 0: Chave de Acesso */}
            <div style={{
              background: chaveValidada ? "#f0fdf4" : "#fff",
              borderRadius: "16px",
              padding: "1.5rem",
              marginBottom: "1rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
              border: `1px solid ${chaveValidada ? "#86efac" : "#e2e8f0"}`,
              transition: "all 0.3s",
            }}>
              <h3 style={{ color: "#1e3a5f", fontWeight: 700, marginBottom: "0.4rem", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: chaveValidada ? "#22c55e" : "#c6a43f" }}>
                  {chaveValidada ? "verified" : "vpn_key"}
                </span>
                Chave de Acesso
                {chaveValidada && <span style={{ color: "#22c55e", fontSize: "0.75rem", fontWeight: 600 }}>✓ Validada</span>}
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "1rem" }}>
                Insira a chave de acesso vitalícia que você adquiriu para criar sua turma.
              </p>

              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <span className="material-symbols-outlined" style={{
                    position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                    color: chaveValidada ? "#22c55e" : "#94a3b8", fontSize: "18px",
                  }}>key</span>
                  <input
                    type="text"
                    value={chaveAcesso}
                    onChange={(e) => { setChaveAcesso(e.target.value); setChaveValidada(false); setErroChave(""); }}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    disabled={chaveValidada}
                    style={{
                      width: "100%", paddingLeft: "42px", paddingRight: "16px",
                      paddingTop: "11px", paddingBottom: "11px",
                      border: `1.5px solid ${chaveValidada ? "#86efac" : erroChave ? "#fca5a5" : "#e2e8f0"}`,
                      borderRadius: "10px",
                      fontSize: "0.9rem", color: "#1e293b",
                      background: chaveValidada ? "#f0fdf4" : "#f8fafc",
                      outline: "none", boxSizing: "border-box" as const,
                      opacity: chaveValidada ? 0.8 : 1,
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleValidarChave}
                  disabled={validandoChave || chaveValidada}
                  style={{
                    background: chaveValidada
                      ? "#22c55e"
                      : "linear-gradient(135deg, #1e3a5f 0%, #2d5286 100%)",
                    color: "#fff", border: "none",
                    borderRadius: "10px", padding: "0 20px",
                    fontWeight: 700, fontSize: "0.85rem",
                    cursor: validandoChave || chaveValidada ? "default" : "pointer",
                    whiteSpace: "nowrap" as const,
                    opacity: validandoChave ? 0.7 : 1,
                    transition: "all 0.2s",
                  }}
                >
                  {validandoChave ? "..." : chaveValidada ? "✓ OK" : "Validar"}
                </button>
              </div>

              {erroChave && (
                <p style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: "6px", fontWeight: 500 }}>
                  {erroChave}
                </p>
              )}
            </div>

            {/* Card 1: Dados da Turma */}
            <div style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "1.5rem",
              marginBottom: "1rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
              border: "1px solid #e2e8f0",
            }}>
              <h3 style={{ color: "#1e3a5f", fontWeight: 700, marginBottom: "1.2rem", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#c6a43f" }}>info</span>
                Dados da Turma
              </h3>

              {/* Nome da Turma */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                  Nome da Turma *
                </label>
                <div style={{ position: "relative" }}>
                  <span className="material-symbols-outlined" style={{
                    position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                    color: "#94a3b8", fontSize: "18px",
                  }}>groups</span>
                  <input
                    type="text"
                    value={nomeTurma}
                    onChange={(e) => setNomeTurma(e.target.value)}
                    placeholder="Ex: Medicina - Turma Alpha"
                    required
                    style={{
                      width: "100%", paddingLeft: "42px", paddingRight: "16px",
                      paddingTop: "11px", paddingBottom: "11px",
                      border: "1.5px solid #e2e8f0", borderRadius: "10px",
                      fontSize: "0.9rem", color: "#1e293b", background: "#f8fafc",
                      outline: "none", boxSizing: "border-box",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#1e3a5f"}
                    onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                  />
                </div>
              </div>

              {/* Escola */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                  Instituição / Escola *
                </label>
                <div style={{ position: "relative" }}>
                  <span className="material-symbols-outlined" style={{
                    position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                    color: "#94a3b8", fontSize: "18px",
                  }}>school</span>
                  <input
                    type="text"
                    value={escola}
                    onChange={(e) => setEscola(e.target.value)}
                    placeholder="Ex: Terceirão ADIMIN"
                    required
                    style={{
                      width: "100%", paddingLeft: "42px", paddingRight: "16px",
                      paddingTop: "11px", paddingBottom: "11px",
                      border: "1.5px solid #e2e8f0", borderRadius: "10px",
                      fontSize: "0.9rem", color: "#1e293b", background: "#f8fafc",
                      outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#1e3a5f"}
                    onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                  />
                </div>
              </div>

              {/* Ano e Meta */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                    Ano de Formatura *
                  </label>
                  <div style={{ position: "relative" }}>
                    <span className="material-symbols-outlined" style={{
                      position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                      color: "#94a3b8", fontSize: "18px",
                    }}>calendar_month</span>
                    <input
                      type="number"
                      value={ano}
                      onChange={(e) => setAno(e.target.value)}
                      min="2024"
                      max="2035"
                      required
                      style={{
                        width: "100%", paddingLeft: "42px", paddingRight: "8px",
                        paddingTop: "11px", paddingBottom: "11px",
                        border: "1.5px solid #e2e8f0", borderRadius: "10px",
                        fontSize: "0.9rem", color: "#1e293b", background: "#f8fafc",
                        outline: "none", boxSizing: "border-box",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#1e3a5f"}
                      onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                    Meta Total (R$)
                  </label>
                  <div style={{ position: "relative" }}>
                    <span className="material-symbols-outlined" style={{
                      position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                      color: "#94a3b8", fontSize: "18px",
                    }}>paid</span>
                    <input
                      type="number"
                      value={metaTotal}
                      onChange={(e) => setMetaTotal(e.target.value)}
                      placeholder="0,00"
                      min="0"
                      step="0.01"
                      style={{
                        width: "100%", paddingLeft: "42px", paddingRight: "8px",
                        paddingTop: "11px", paddingBottom: "11px",
                        border: "1.5px solid #e2e8f0", borderRadius: "10px",
                        fontSize: "0.9rem", color: "#1e293b", background: "#f8fafc",
                        outline: "none", boxSizing: "border-box",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#1e3a5f"}
                      onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Senha da Turma */}
            <div style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "1.5rem",
              marginBottom: "1rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
              border: "1px solid #e2e8f0",
            }}>
              <h3 style={{ color: "#1e3a5f", fontWeight: 700, marginBottom: "0.4rem", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#c6a43f" }}>lock</span>
                Senha da Turma
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "1.2rem" }}>
                Esta senha será compartilhada com os alunos para que eles possam entrar na turma.
              </p>

              {/* Senha */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                  Criar Senha *
                </label>
                <div style={{ position: "relative" }}>
                  <span className="material-symbols-outlined" style={{
                    position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                    color: "#94a3b8", fontSize: "18px",
                  }}>key</span>
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    value={senhaTurma}
                    onChange={(e) => setSenhaTurma(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: "100%", paddingLeft: "42px", paddingRight: "42px",
                      paddingTop: "11px", paddingBottom: "11px",
                      border: "1.5px solid #e2e8f0", borderRadius: "10px",
                      fontSize: "0.9rem", color: "#1e293b", background: "#f8fafc",
                      outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#1e3a5f"}
                    onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    style={{
                      position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: "#94a3b8",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                      {mostrarSenha ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>

                {/* Barra de força */}
                {senhaTurma && (
                  <div style={{ marginTop: "10px" }}>
                    <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} style={{
                          flex: 1, height: "5px", borderRadius: "3px",
                          background: i <= forca ? getCorBarra() : "#e2e8f0",
                          transition: "background 0.3s",
                        }} />
                      ))}
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                      Força: <span style={{ color: getCorBarra() }}>{getTextoForca()}</span>
                    </p>
                  </div>
                )}

                {/* Checklist de requisitos */}
                {senhaTurma && (
                  <div style={{
                    marginTop: "12px", padding: "12px",
                    background: "#f8fafc", borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                  }}>
                    {requisitos.map((req, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        marginBottom: i < requisitos.length - 1 ? "6px" : 0,
                      }}>
                        <span className="material-symbols-outlined" style={{
                          fontSize: "16px",
                          color: req.ok ? "#22c55e" : "#94a3b8",
                        }}>
                          {req.ok ? "check_circle" : "radio_button_unchecked"}
                        </span>
                        <span style={{
                          fontSize: "0.78rem",
                          color: req.ok ? "#166534" : "#64748b",
                          fontWeight: req.ok ? 600 : 400,
                        }}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirmar senha */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                  Confirmar Senha *
                </label>
                <div style={{ position: "relative" }}>
                  <span className="material-symbols-outlined" style={{
                    position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                    color: "#94a3b8", fontSize: "18px",
                  }}>lock_open</span>
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: "100%", paddingLeft: "42px", paddingRight: "16px",
                      paddingTop: "11px", paddingBottom: "11px",
                      border: `1.5px solid ${confirmarSenha && confirmarSenha !== senhaTurma ? "#ef4444" : "#e2e8f0"}`,
                      borderRadius: "10px",
                      fontSize: "0.9rem", color: "#1e293b", background: "#f8fafc",
                      outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#1e3a5f"}
                    onBlur={(e) => e.target.style.borderColor = confirmarSenha && confirmarSenha !== senhaTurma ? "#ef4444" : "#e2e8f0"}
                  />
                </div>
                {confirmarSenha && confirmarSenha !== senhaTurma && (
                  <p style={{ color: "#ef4444", fontSize: "0.77rem", marginTop: "4px", fontWeight: 500 }}>
                    As senhas não coincidem.
                  </p>
                )}
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: "10px", padding: "12px 16px", marginBottom: "1rem",
                display: "flex", alignItems: "center", gap: "10px",
              }}>
                <span className="material-symbols-outlined" style={{ color: "#dc2626", fontSize: "18px" }}>error</span>
                <p style={{ color: "#dc2626", fontSize: "0.85rem", fontWeight: 500 }}>{error}</p>
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading || !chaveValidada}
              style={{
                width: "100%",
                background: loading || !chaveValidada
                  ? "#94a3b8"
                  : "linear-gradient(135deg, #1e3a5f 0%, #2d5286 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "15px",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: loading || !chaveValidada ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                boxShadow: loading || !chaveValidada ? "none" : "0 4px 20px rgba(30,58,95,0.35)",
                transition: "all 0.2s",
                letterSpacing: "0.3px",
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: "20px", height: "20px",
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  Criando turma...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add_circle</span>
                  Criar Turma
                </>
              )}
            </button>

            <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.82rem", color: "#94a3b8" }}>
              Você poderá editar essas informações depois nas configurações.
            </p>
          </form>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}