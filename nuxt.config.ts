// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  ssr: false,
  typescript: {
    strict: true,
  },
  alias: {
    "~core": "./core",
    "~workers": "./app/workers",
    "@": ".",
  },
  modules: ["@nuxtjs/tailwindcss"],
  css: ["@/assets/css/main.css"],
});
