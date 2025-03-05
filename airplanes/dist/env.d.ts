declare namespace NodeJS {
  export interface ProcessEnv {
    API_KEY: string;
    DATABASE_URL: string;
    NODE_ENV?: "development" | "production";
  }
}
