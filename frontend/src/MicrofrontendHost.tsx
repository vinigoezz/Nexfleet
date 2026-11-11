import { useEffect, useRef, useState } from "react";

export type MicrofrontendProps = {
  token: string;
  perfil: string;
};

type RemoteModule = {
  mount: (
    container: HTMLElement,
    props: MicrofrontendProps,
  ) => void | (() => void);
};

export type RemoteLoader = (url: string) => Promise<RemoteModule>;

const importar: RemoteLoader = (url) => import(/* @vite-ignore */ url);

export function MicrofrontendHost({
  nome,
  url,
  props,
  loader = importar,
}: {
  nome: string;
  url: string;
  props: MicrofrontendProps;
  loader?: RemoteLoader;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState("Carregando…");

  useEffect(() => {
    let ativo = true;
    let desmontar: void | (() => void);
    let estilo: HTMLLinkElement | undefined;

    loader(url)
      .then((remote) => {
        if (!ativo || !container.current) return;
        if (typeof remote.mount !== "function")
          throw new Error("Contrato mount ausente");
        if (url.endsWith(".js")) {
          estilo = document.createElement("link");
          estilo.rel = "stylesheet";
          estilo.href = url.replace(/\.js$/, ".css");
          estilo.dataset.nexfleetMfe = nome;
          document.head.appendChild(estilo);
        }
        desmontar = remote.mount(container.current, props);
        setEstado("");
      })
      .catch(() => {
        if (ativo)
          setEstado(
            `Não foi possível carregar ${nome}. Confira se o microfrontend está iniciado.`,
          );
      });

    return () => {
      ativo = false;
      if (typeof desmontar === "function") desmontar();
      estilo?.remove();
    };
  }, [loader, nome, props.perfil, props.token, url]);

  return (
    <section className="mfe-host" aria-label={`Microfrontend ${nome}`}>
      {estado && <p role="status">{estado}</p>}
      <div ref={container} />
    </section>
  );
}
