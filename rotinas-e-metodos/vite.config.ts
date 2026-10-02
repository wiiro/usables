/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Os dados ficam no localStorage, que o navegador separa por endereço
// (localhost:PORTA). A porta é fixa e igual à do abrir.cmd para o app nunca
// "aparecer vazio" por ter subido em outra porta; strictPort faz o Vite falhar
// em vez de pular silenciosamente para a próxima porta livre.
const PORT = 8790

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: PORT, strictPort: true },
  preview: { port: PORT, strictPort: true },
  // O app é servido do próprio computador (abrir.cmd), então o tamanho do
  // pacote não pesa no carregamento; o aviso padrão de 500 kB seria só ruído.
  build: { chunkSizeWarningLimit: 1500 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
