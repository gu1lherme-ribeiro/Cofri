function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const serverEnv = {
  get authJwtSecret() {
    return required("AUTH_JWT_SECRET");
  },
  get encryptionMasterKey() {
    return required("ENCRYPTION_MASTER_KEY");
  },
};

export const SESSION_COOKIE = "cofri_session";
