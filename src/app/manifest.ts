import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vanto Coach',
    short_name: 'Vanto Coach',
    description: 'Christian AI executive life coach for reflection, action, scripture, and insights',
    start_url: '/coach',
    display: 'standalone',
    background_color: '#f8f4eb',
    theme_color: '#2e6047',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
