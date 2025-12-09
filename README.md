#Lancer l'app

###Serveur

cd server

npm run dev

###Ngrok

ngrok http 3001

###Expo

npm start

###ssl

npx serve dist --ssl-cert C:\Users\m.philippe\mkcert\localhost.pem --ssl-key C:\Users\m.philippe\mkcert\localhost-key.pem

Une dernière petite astuce pour la route : Gardez précieusement vos fichiers localhost+1.pem et la commande pour lancer le serveur. Si un jour vous changez d'adresse IP (ça arrive souvent en redémarrant la box internet), il faudra juste refaire un petit mkcert localhost NOUVELLE_IP et c'est reparti.