export default defineConfig({
  plugins: [react()],
  base: "/chatbotui/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
