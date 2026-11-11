import { mount } from "./entry";
const root = document.getElementById("root");
if (root) mount(root, { token: "modo-isolado", perfil: "GESTOR_FROTA" });
