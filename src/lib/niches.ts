

const CREATOR_NICHES_BASE = [
  "Moda e Beleza", "Tecnologia", "Saúde e Bem-estar", "Educação", "Entretenimento",
  "Esportes", "Gastronomia", "Viagem e Turismo", "Negócios e Empreendedorismo",
  "Arte e Cultura", "Música", "Jogos", "Fitness e Esportes", "Maternidade e Família",
  "Automotivo", "Imóveis", "Finanças", "Política", "Meio Ambiente",
  "Renda extra", "Saúde infantil", "Psicologia", "Desenvolvimento pessoal", "Outros"
];

const CAMPAIGN_TYPES_BASE = [
  "Skincare", "Maquiagem", "beleza e bem-estar", "Moda feminina", "Moda fitness", "Moda praia", "Joias e bijuterias", "Sapatos e bolsas",
  "Tecnologia e eletrônicos", "Smartphones e acessórios", "Casa e decoração", "Organização", "Limpeza", "Gastronomia e bebidas", "Alimentação saudável", "Doces e confeitaria",
  "Maternidade e infantil", "Viagem e lazer", "Turismo e experiências", "Pets",
];

const LOWERCASE_WORDS = new Set(["e", "de", "da", "do", "das", "dos", "a", "o", "as", "os", "em"]);

function toTitleCaseBasic(value: string): string {
  return value
    .split(/(\s+|[-/])/)
    .map((part) => {
      if (part.trim() === "" || part === "-" || part === "/") return part;
      const lower = part.toLowerCase();
      if (LOWERCASE_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}


const unifiedSet = new Map<string, string>();
for (const item of [...CREATOR_NICHES_BASE, ...CAMPAIGN_TYPES_BASE]) {
  const normalized = item.trim();
  if (!normalized) continue;
  const canonical = toTitleCaseBasic(normalized);
  const key = canonical.toLowerCase();
  if (!unifiedSet.has(key)) unifiedSet.set(key, canonical);
}

export const NICHES: string[] = Array.from(unifiedSet.values());

export default NICHES;


