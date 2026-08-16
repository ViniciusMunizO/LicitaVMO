import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serve o projeto num subcaminho (https://usuario.github.io/LicitaVMO/),
// então o base só precisa mudar no build de produção — o dev server continua em "/".
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/LicitaVMO/' : '/',
  server: {
    port: 5173
  }
}))
