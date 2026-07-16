import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  build: {
    license: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react-vendor', test: /node_modules\/(?:react|react-dom)\// },
            { name: 'supabase-vendor', test: /node_modules\/@supabase\// },
            { name: 'motion-vendor', test: /node_modules\/(?:motion|framer-motion)\// },
            { name: 'icons-vendor', test: /node_modules\/lucide-react\// },
          ],
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
})
