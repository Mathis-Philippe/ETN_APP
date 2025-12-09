import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// Ce fichier configure le HTML racine pour le Web uniquement.
// Il garantit que les icônes sont visibles par le robot d'Apple immédiatement.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* --- DÉBUT CONFIGURATION PWA --- */}
        {/* Indispensable pour iOS : Lien direct statique */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        
        <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon.png" />


        <link rel="icon" type="image/png" sizes="32x32" href="/icon-app.png" />
        <link rel="manifest" href="/manifest.json" />
        <ScrollViewStyleReset />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}