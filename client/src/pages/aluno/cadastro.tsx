import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import ThemeToggle from "../../components/ThemeToggle";

export default function AlunoCadastro() {
  const { registerAluno } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [salaId, setSalaId] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const calcularForca = (s: string) => {
    let score = 0;
    if (s.length >= 8) score++;
    if (/[A-Z]/.test(s)) score++;
    if (/[a-z]/.test(s)) score++;
    if (/[0-9]/.test(s)) score++;
    if (/[^A-Za-z0-9]/.test(s)) score++;
    return score;
  };
  const forca = calcularForca(senha);

  async function handleRegister() {
    setError("");
    setLoading(true);
    try {
      await registerAluno.mutateAsync({
        nome, email, senha, salaId
      });
      navigate("/aluno/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
      <div className="absolute top-6 right-6"><ThemeToggle /></div>

      <div className="w-full max-w-md animate-fade-in card p-8 space-y-6">
        <div className="text-center">
          <div className="mx-auto size-14 bg-blue-50 dark:bg-blue-900/20 text-primary rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl">school</span>
          </div>
          <h2 className="text-2xl font-black">Cadastro de Aluno</h2>
          <p className="text-slate-500 text-sm mt-1">Crie sua conta para acompanhar sua turma.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-1">Nome Completo</label>
            <input className="input" placeholder="João Silva" value={nome} onChange={e => setNome(e.target.value)} />
          </div>
          
          <div>
            <label className="text-sm font-semibold block mb-1">E-mail</label>
            <input className="input" type="email" placeholder="jao@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-semibold block mb-1">ID da Turma</label>
            <input className="input" placeholder="Ex: 5" value={salaId} onChange={e => setSalaId(e.target.value)} />
            <p className="text-xs text-slate-400 mt-1">Solicite o ID numérico da turma ao admin.</p>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-1">Senha</label>
            <input className="input" type="password" placeholder="Mínimo 8 caracteres" value={senha} onChange={e => setSenha(e.target.value)} />
            <div className="flex gap-1 h-1.5 mt-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${
                  i <= forca ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                }`} />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>}
          
          <button 
            onClick={handleRegister} 
            disabled={loading || !nome || !email || !senha || !salaId} 
            className="btn-primary w-full py-3 mt-2"
          >
            {loading ? "Criando conta..." : "Completar Cadastro"}
          </button>

          <p className="text-center text-sm text-slate-500 font-medium">
            Já tem uma conta? <Link to="/acesso" className="text-primary hover:underline">Faça login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
