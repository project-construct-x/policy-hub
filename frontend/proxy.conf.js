// Proxied `/api` zum Backend, sodass der Browser nur mit diesem Dev-Server spricht — same-origin,
// kein CORS nötig. Ziel unterscheidet sich je Laufzeitumgebung: lokal `localhost:8080`
// (`./gradlew bootRun`), in Docker Compose der Service-Name `backend` (siehe docker-compose.yml).
const target = process.env['BACKEND_PROXY_TARGET'] || 'http://localhost:8080';

module.exports = {
  '/api': {
    target,
    changeOrigin: true,
  },
};
