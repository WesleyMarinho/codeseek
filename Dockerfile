# Estágio de construção para o frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend

# Copiar arquivos de configuração do frontend
COPY frontend/package*.json ./

# Instalar dependências do frontend
RUN npm install

# Copiar código-fonte do frontend
COPY frontend/ ./

# Construir assets do frontend
RUN npm run build-css-prod

# Estágio de construção para o backend
FROM node:18-alpine AS backend-build
WORKDIR /app/backend

# Copiar arquivos de configuração do backend
COPY backend/package*.json ./

# Instalar dependências do backend
RUN npm install --production

# Estágio final
FROM node:18-alpine
WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache curl

# Criar diretório de uploads
RUN mkdir -p /app/backend/uploads

# Copiar arquivos do backend
COPY --from=backend-build /app/backend/node_modules /app/backend/node_modules
COPY backend/ /app/backend/

# Copiar arquivos do frontend
COPY --from=frontend-build /app/frontend/public /app/frontend/public
COPY frontend/ /app/frontend/

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Expor porta
EXPOSE 3000

# Definir diretório de trabalho para o backend
WORKDIR /app/backend

# Verificação de saúde
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 CMD curl -f http://localhost:3000/health || exit 1

# Comando para iniciar a aplicação
CMD ["node", "server.js"]