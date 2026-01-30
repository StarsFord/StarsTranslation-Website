# 🚀 Guia Completo de Deploy - StarsTranslations

## Arquitetura do Deploy

```
Frontend (Vercel)
   ↓ API calls
Backend (Google Cloud Run)
   ↓ uploads
Google Cloud Storage (arquivos)
   ↓ data
Cloud Storage / SQLite (database)
```

## 📋 Pré-requisitos

### 1. Contas Necessárias
- ✅ Conta Google Cloud Platform (GCP)
- ✅ Conta Vercel (ou Netlify)
- ✅ Conta GitHub (para CI/CD automático)
- ✅ Aplicação Patreon OAuth configurada

### 2. Ferramentas Locais
```bash
# Instalar Google Cloud SDK
https://cloud.google.com/sdk/docs/install

# Instalar Vercel CLI (opcional, mas recomendado)
npm install -g vercel

# Docker (para testar localmente)
https://www.docker.com/products/docker-desktop
```

---

## PARTE 1: Setup do Google Cloud

### 1.1. Criar Projeto GCP

```bash
# Fazer login no GCP
gcloud auth login

# Criar projeto
gcloud projects create starstranslations-prod --name="StarsTranslations"

# Definir projeto ativo
gcloud config set project starstranslations-prod

# Ativar billing (necessário para Cloud Run)
# Faça isso no console: https://console.cloud.google.com/billing
```

### 1.2. Ativar APIs Necessárias

```bash
# Cloud Run
gcloud services enable run.googleapis.com

# Cloud Storage
gcloud services enable storage.googleapis.com

# Container Registry
gcloud services enable containerregistry.googleapis.com

# Artifact Registry (recomendado, mais moderno)
gcloud services enable artifactregistry.googleapis.com
```

### 1.3. Criar Google Cloud Storage Bucket

```bash
# Criar bucket para uploads
gsutil mb -l US -c STANDARD gs://starstranslations-uploads

# Tornar bucket publicamente acessível para leitura
gsutil iam ch allUsers:objectViewer gs://starstranslations-uploads

# Configurar CORS (permitir uploads do frontend via browser)
cat > cors.json <<EOF
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://starstranslations-uploads
rm cors.json

# Criar bucket para database (opcional, para backup)
gsutil mb -l US -c STANDARD gs://starstranslations-database
```

### 1.4. Criar Service Account para Cloud Run

```bash
# Criar service account
gcloud iam service-accounts create starstranslations-backend \
    --display-name="StarsTranslations Backend"

# Dar permissões ao service account
gcloud projects add-iam-policy-binding starstranslations-prod \
    --member="serviceAccount:starstranslations-backend@starstranslations-prod.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

# Gerar chave (para desenvolvimento local)
gcloud iam service-accounts keys create ./service-account-key.json \
    --iam-account=starstranslations-backend@starstranslations-prod.iam.gserviceaccount.com

# ⚠️  IMPORTANTE: Adicione service-account-key.json ao .gitignore!
echo "service-account-key.json" >> .gitignore
```

---

## PARTE 2: Deploy do Backend (Google Cloud Run)

### 2.1. Preparar Variáveis de Ambiente

Crie um arquivo `env.yaml` (NÃO commitar no git!):

```yaml
# env.yaml
PORT: "8080"
NODE_ENV: "production"
CLIENT_URL: "https://seu-app.vercel.app"
JWT_SECRET: "seu-jwt-secret-super-seguro-aqui"
SESSION_SECRET: "seu-session-secret-super-seguro-aqui"
PATREON_CLIENT_ID: "seu-patreon-client-id"
PATREON_CLIENT_SECRET: "seu-patreon-client-secret"
PATREON_CALLBACK_URL: "https://seu-backend.run.app/auth/patreon/callback"
DATABASE_PATH: "/data/database.db"
MAX_FILE_SIZE: "5368709120"
GCP_PROJECT_ID: "starstranslations-prod"
GCS_BUCKET_NAME: "starstranslations-uploads"
GCS_BUCKET_LOCATION: "US"
```

Adicione ao .gitignore:
```bash
echo "env.yaml" >> .gitignore
```

### 2.2. Build e Deploy com Docker

```bash
# Build da imagem Docker
docker build -t gcr.io/starstranslations-prod/backend:latest .

# Testar localmente (opcional)
docker run -p 8080:8080 --env-file .env gcr.io/starstranslations-prod/backend:latest

# Push para Google Container Registry
docker push gcr.io/starstranslations-prod/backend:latest

# Deploy no Cloud Run
gcloud run deploy starstranslations-backend \
  --image gcr.io/starstranslations-prod/backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --service-account starstranslations-backend@starstranslations-prod.iam.gserviceaccount.com \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --env-vars-file env.yaml

# Obter URL do backend
gcloud run services describe starstranslations-backend \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)'
```

### 2.3. Configurar Database Persistente

**Opção A: SQLite com Cloud Storage (mais barato)**

```bash
# Criar script de backup automático
cat > backup-db.sh <<'EOF'
#!/bin/bash
# Backup database to Cloud Storage every hour
gsutil cp /data/database.db gs://starstranslations-database/database-$(date +%Y%m%d-%H%M%S).db
gsutil cp /data/database.db gs://starstranslations-database/database-latest.db
EOF

chmod +x backup-db.sh

# Adicionar ao cron no container (ou usar Cloud Scheduler)
```

**Opção B: Cloud SQL (PostgreSQL/MySQL) - mais robusto, mais caro**

Se quiser migrar para um banco de dados real:

```bash
# Criar instância Cloud SQL
gcloud sql instances create starstranslations-db \
    --database-version=POSTGRES_14 \
    --tier=db-f1-micro \
    --region=us-central1

# Criar banco de dados
gcloud sql databases create starstranslations \
    --instance=starstranslations-db

# Conectar Cloud Run ao Cloud SQL
# Adicionar flag ao deploy:
# --add-cloudsql-instances starstranslations-prod:us-central1:starstranslations-db
```

### 2.4. Setup de CI/CD Automático (GitHub Actions)

Crie `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to Cloud Run

on:
  push:
    branches:
      - main
    paths:
      - 'server/**'
      - 'Dockerfile'
      - 'package.json'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Cloud SDK
      uses: google-github-actions/setup-gcloud@v1
      with:
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        project_id: starstranslations-prod

    - name: Configure Docker
      run: gcloud auth configure-docker

    - name: Build Docker image
      run: |
        docker build -t gcr.io/starstranslations-prod/backend:${{ github.sha }} .
        docker tag gcr.io/starstranslations-prod/backend:${{ github.sha }} gcr.io/starstranslations-prod/backend:latest

    - name: Push to Container Registry
      run: |
        docker push gcr.io/starstranslations-prod/backend:${{ github.sha }}
        docker push gcr.io/starstranslations-prod/backend:latest

    - name: Deploy to Cloud Run
      run: |
        gcloud run deploy starstranslations-backend \
          --image gcr.io/starstranslations-prod/backend:latest \
          --platform managed \
          --region us-central1 \
          --allow-unauthenticated
```

**Configurar Secrets no GitHub:**
1. Vá em Settings → Secrets → Actions
2. Adicione `GCP_SA_KEY` com o conteúdo de `service-account-key.json`

---

## PARTE 3: Deploy do Frontend (Vercel)

### 3.1. Preparar Frontend para Produção

Atualize `src/utils/api.ts` para usar variável de ambiente:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ... resto do código
```

### 3.2. Criar Arquivo de Configuração Vercel

Crie `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "https://sua-url-backend.run.app"
  }
}
```

### 3.3. Deploy no Vercel

**Opção A: Via CLI**

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd seu-projeto
vercel

# Produção
vercel --prod
```

**Opção B: Via GitHub (RECOMENDADO)**

1. Faça push do código para GitHub
2. Vá em [vercel.com/new](https://vercel.com/new)
3. Import seu repositório
4. Configure variáveis de ambiente:
   - `VITE_API_URL`: URL do seu backend Cloud Run
5. Deploy automático!

### 3.4. Configurar Variáveis de Ambiente no Vercel

No dashboard Vercel:
1. Settings → Environment Variables
2. Adicione:
   - `VITE_API_URL`: `https://seu-backend.run.app`

### 3.5. Configurar CORS no Backend

Atualize `server/index.ts` para aceitar domínio Vercel:

```typescript
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
```

E adicione no `env.yaml`:
```yaml
CLIENT_URL: "https://seu-app.vercel.app"
```

Redeploy do backend:
```bash
gcloud run deploy starstranslations-backend \
  --image gcr.io/starstranslations-prod/backend:latest \
  --update-env-vars CLIENT_URL=https://seu-app.vercel.app
```

---

## PARTE 4: Configuração de Domínio Customizado

### 4.1. Frontend (Vercel)

1. No Vercel Dashboard → Settings → Domains
2. Adicione seu domínio: `starstranslations.com`
3. Configure DNS no seu provedor:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

### 4.2. Backend (Cloud Run)

```bash
# Mapear domínio customizado
gcloud beta run domain-mappings create \
  --service starstranslations-backend \
  --domain api.starstranslations.com \
  --region us-central1

# Seguir instruções para configurar DNS
```

---

## PARTE 5: Monitoramento e Logs

### 5.1. Cloud Run Logs

```bash
# Ver logs em tempo real
gcloud run services logs tail starstranslations-backend

# Ver logs de erro
gcloud run services logs read starstranslations-backend --limit=50 --filter="severity=ERROR"
```

### 5.2. Monitoring Dashboard

Acesse: https://console.cloud.google.com/run

### 5.3. Alertas (Opcional)

Configure alertas no Google Cloud Monitoring para:
- Alta latência
- Erros 5xx
- Alto uso de memória
- Custos inesperados

---

## PARTE 6: Custos Estimados

### Google Cloud Run (Backend)
- **Free tier**: 2 milhões de requisições/mês
- **Custo aproximado**: $0-5/mês para tráfego baixo
- **Com tráfego médio**: $10-20/mês

### Google Cloud Storage
- **Armazenamento**: $0.02/GB/mês
- **50GB de arquivos**: ~$1/mês
- **Transferência**: Primeiros 1GB grátis, depois $0.12/GB

### Vercel (Frontend)
- **Hobby plan**: GRÁTIS
- **Pro plan**: $20/mês (se precisar)

### **TOTAL ESTIMADO: $5-15/mês para começar**

---

## PARTE 7: Checklist de Deploy

### Antes do Deploy:
- [ ] Criar projeto GCP
- [ ] Ativar billing no GCP
- [ ] Criar buckets Cloud Storage
- [ ] Configurar service account
- [ ] Criar arquivo `env.yaml` com secrets
- [ ] Adicionar `.gitignore` para secrets
- [ ] Build Docker local e testar
- [ ] Atualizar Patreon OAuth callback URL
- [ ] Configurar variáveis de ambiente no Vercel

### Durante o Deploy:
- [ ] Push imagem Docker para GCR
- [ ] Deploy Cloud Run
- [ ] Testar backend URL
- [ ] Deploy frontend no Vercel
- [ ] Testar frontend URL
- [ ] Verificar CORS funcionando
- [ ] Testar Patreon OAuth
- [ ] Testar upload de arquivos

### Depois do Deploy:
- [ ] Configurar domínio customizado
- [ ] Setup CI/CD (GitHub Actions)
- [ ] Configurar backups do database
- [ ] Monitorar logs por 24h
- [ ] Testar todas funcionalidades
- [ ] Configurar alertas de erro

---

## PARTE 8: Troubleshooting

### Erro: "Permission Denied" no Cloud Storage

```bash
# Verificar permissões do service account
gcloud projects get-iam-policy starstranslations-prod \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:starstranslations-backend@"

# Adicionar permissões
gcloud projects add-iam-policy-binding starstranslations-prod \
  --member="serviceAccount:starstranslations-backend@starstranslations-prod.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

### Erro: CORS bloqueando requests

Atualize CORS no backend:
```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://seu-app.vercel.app',
    'https://starstranslations.com'
  ],
  credentials: true
}));
```

### Database não persiste

Verifique se está usando volume persistente:
```bash
# Cloud Run não persiste arquivos locais por padrão!
# Use Cloud Storage ou Cloud SQL
```

### Alto custo inesperado

```bash
# Verificar custos
gcloud billing accounts list
gcloud billing budgets list

# Configurar orçamento
# https://console.cloud.google.com/billing/budgets
```

---

## PARTE 9: Comandos Úteis

```bash
# Ver serviços Cloud Run
gcloud run services list

# Ver logs
gcloud run services logs tail starstranslations-backend --region us-central1

# Atualizar variável de ambiente
gcloud run services update starstranslations-backend \
  --update-env-vars KEY=VALUE

# Ver detalhes do serviço
gcloud run services describe starstranslations-backend --region us-central1

# Deletar serviço
gcloud run services delete starstranslations-backend --region us-central1

# Listar buckets
gsutil ls

# Listar arquivos em um bucket
gsutil ls gs://starstranslations-uploads/

# Copiar arquivo para bucket
gsutil cp local-file.db gs://starstranslations-database/

# Copiar arquivo de bucket
gsutil cp gs://starstranslations-database/database.db ./local-file.db
```

---

## 📞 Suporte e Recursos

- **Google Cloud Run Docs**: https://cloud.google.com/run/docs
- **Vercel Docs**: https://vercel.com/docs
- **Cloud Storage Docs**: https://cloud.google.com/storage/docs

---

🎉 **Seu site está no ar!**

Frontend: `https://seu-app.vercel.app`
Backend: `https://starstranslations-backend-xxx.run.app`
