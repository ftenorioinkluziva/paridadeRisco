/**
 * Calcula a idade com base na data de nascimento
 * @param dataNascimento Data de nascimento
 * @returns Idade em anos completos
 */
export function calcularIdade(dataNascimento: Date | string | null): number | null {
  if (!dataNascimento) return null;

  const nascimento = typeof dataNascimento === 'string'
    ? new Date(dataNascimento)
    : dataNascimento;

  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mesAtual = hoje.getMonth();
  const diaAtual = hoje.getDate();
  const mesNascimento = nascimento.getMonth();
  const diaNascimento = nascimento.getDate();

  // Ajusta se ainda não fez aniversário este ano
  if (mesAtual < mesNascimento || (mesAtual === mesNascimento && diaAtual < diaNascimento)) {
    idade--;
  }

  return idade;
}

/**
 * Formata uma data para o formato de input date (YYYY-MM-DD)
 * @param date Data a ser formatada
 * @returns String no formato YYYY-MM-DD
 */
export function formatDateForInput(date: Date | string | null): string {
  if (!date) return "";

  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Formata uma data para exibição (DD/MM/YYYY)
 * @param date Data a ser formatada
 * @returns String no formato DD/MM/YYYY
 */
export function formatDateForDisplay(date: Date | string | null): string {
  if (!date) return "";

  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}
