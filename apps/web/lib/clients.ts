/**
 * Companies the team has worked on projects for (CLAUDE.md §10.7 proof
 * points). `logo` is a filename under public/clients/ — when null, the
 * logo wall renders the styled company name instead.
 */
export type Client = {
  key: string;
  name: string;
  logo: string | null;
};

export const clients: Client[] = [
  { key: "itau", name: "Itaú", logo: "itau.svg" },
  // PagSeguro rebranded to PagBank (2023) — current official mark.
  { key: "pagseguro", name: "PagBank", logo: "pagseguro.svg" },
  { key: "nissan", name: "Nissan", logo: "nissan.svg" },
  { key: "bridgestone", name: "Bridgestone", logo: "bridgestone.svg" },
  { key: "alloha", name: "Alloha Fibra", logo: "alloha.png" },
  { key: "semparar", name: "Sem Parar", logo: "semparar.svg" },
  { key: "associa", name: "Associa", logo: "associa.svg" },
  { key: "golance", name: "goLance", logo: "golance.svg" },
  { key: "intel", name: "Intel", logo: "intel.svg" },
];
