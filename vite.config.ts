import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'client',
  plugins: [react()],
  build: {
    outDir: '../dist/client', // opcional: puedes cambiar dónde poner los archivos generados
    emptyOutDir: true
  }
})
