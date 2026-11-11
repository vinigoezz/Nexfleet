const desenvolvimento = import.meta.env.DEV;

export const remotes = {
  frota:
    import.meta.env.VITE_MFE_FROTA_URL ??
    (desenvolvimento
      ? "http://127.0.0.1:5174/src/entry.tsx"
      : "/mfes/frota/remoteEntry.js"),
  operacoes:
    import.meta.env.VITE_MFE_OPERACOES_URL ??
    (desenvolvimento
      ? "http://127.0.0.1:5175/src/entry.tsx"
      : "/mfes/operacoes/remoteEntry.js"),
  painel:
    import.meta.env.VITE_MFE_PAINEL_URL ??
    (desenvolvimento
      ? "http://127.0.0.1:5176/src/entry.tsx"
      : "/mfes/painel/remoteEntry.js"),
};
