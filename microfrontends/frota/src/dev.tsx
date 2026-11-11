import { mount } from "./entry";

const root = document.getElementById("root");
if (root)
  mount(root, {
    token: "modo-isolado-sem-sessao",
    perfil: "GESTOR_FROTA",
  });
