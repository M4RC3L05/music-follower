export type SessionFlashMessages = {
  error?: string[];
  success?: string[];
  warning?: string[];
  info?: string[];
};

export type SessionFlashFormErrors = Record<string, string[]>;
