import { useId, useState, type FormEvent } from "react";

type ValidatableField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function isValidatableField(target: EventTarget): target is ValidatableField {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  );
}

export function useFormValidation(prefix: string) {
  const suffix = useId().replaceAll(":", "");
  const messageId = `${prefix}-${suffix}`;
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState("");

  function onInvalid(event: FormEvent<HTMLFormElement>) {
    if (!isValidatableField(event.target)) return;
    event.target.setAttribute("aria-invalid", "true");
    event.target.setAttribute("aria-describedby", messageId);
    setAttempted(true);
    setMessage(
      "Revise os campos marcados. Preencha os campos obrigatórios e confira os valores informados.",
    );
  }

  function onInput(event: FormEvent<HTMLFormElement>) {
    if (isValidatableField(event.target) && event.target.validity.valid) {
      event.target.removeAttribute("aria-invalid");
      if (event.target.getAttribute("aria-describedby") === messageId) {
        event.target.removeAttribute("aria-describedby");
      }
    }
    if (!event.currentTarget.querySelector(":invalid")) clear();
  }

  function clear() {
    setAttempted(false);
    setMessage("");
  }

  return {
    attempted,
    message,
    messageId,
    onInvalid,
    onInput,
    clear,
    className: (base: string) =>
      `${base}${attempted ? " validacao-exibida" : ""}`,
  };
}
