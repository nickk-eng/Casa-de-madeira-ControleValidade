# Publicação: Render + MongoDB Atlas

O servidor usa MongoDB Atlas, banco cm_validade, coleção alimentos, com índices criados automaticamente. schema.sql é um arquivo antigo e não é mais utilizado. O login continua usando APP_USERNAME e APP_PASSWORD; reiniciar o servidor encerra as sessões.

## 1. MongoDB Atlas

Crie uma conta em https://cloud.mongodb.com e um projeto. Crie um cluster Free (M0), conferindo que o plano selecionado é gratuito.
Em Database Access, crie um usuário de banco (diferente do login do site), com permissão readWrite no banco cm_validade. Guarde a senha.
Em Connect > Drivers, escolha Node.js e copie a URI mongodb+srv. Substitua usuário e senha pelos do banco, sem os sinais < >. Caracteres especiais da senha precisam de codificação de URL (por exemplo, @ vira %40).

## 2. GitHub

Na pasta do projeto execute:

```powershell
git add server.js package.json package-lock.json render.yaml .env.example README.md
git commit -m "Adapta banco para MongoDB Atlas"
git push origin main
```

Não envie .env. Não coloque a URI real dentro do código ou de render.yaml.

## 3. Render

Crie New > Web Service, conecte o repositório e escolha a branch main. Se o serviço já existir, edite suas configurações.
Runtime: Node. Build Command: npm ci. Start Command: npm start. Health Check Path: /health. Escolha o plano Free, se disponível.
Configure Environment:

| Chave | Valor |
| --- | --- |
| NODE_VERSION | 22 |
| MONGODB_URI | URI real copiada do Atlas, com usuário e senha |
| MONGODB_DB | cm_validade |
| APP_USERNAME | funcionarios |
| APP_PASSWORD | senha forte para entrar no site |

Remova DATABASE_URL das variáveis desse serviço, se existir. Não precisa criar banco no Render. Não apague um banco antigo que contenha dados sem antes preservar uma cópia.
O render.yaml também permite criar o serviço via New > Blueprint, informando os mesmos segredos; ele não cria PostgreSQL.

## 4. Liberar conexão no Atlas

No serviço do Render, abra Connect > Outbound e copie todas as faixas de IP de saída exibidas. No Atlas, em Network Access > Add IP Address, adicione cada faixa CIDR. São os endereços de saída do servidor, não o endereço do site. Salve e aguarde a aplicação das regras.
Se a primeira publicação falhar porque a rede ainda não estava liberada, execute Manual Deploy > Deploy latest commit após cadastrar as faixas.

## 5. Conferir

Nos Logs do Render, procure MongoDB conectado. Abra o site e entre com APP_USERNAME e APP_PASSWORD. Cadastre um alimento, recarregue, edite e confira em Atlas > Browse Collections > cm_validade > alimentos. Exclua o registro de teste e confirme que desapareceu também no Atlas.

## Problemas comuns

- Falha de autenticação: confira o usuário de banco e a senha dentro de MONGODB_URI. Eles são diferentes dos dados do login do site.
- Tempo esgotado: confira Network Access, todas as faixas de saída do Render e se o cluster está ativo.
- Falha de build: confira se package.json e package-lock.json foram enviados juntos.
- Dados antigos não aparecem: esta troca não migra automaticamente registros de PostgreSQL nem do armazenamento local do navegador. Preserve uma exportação CSV antes de desativar a versão antiga.

## Local

Com Node.js 22 atualizado, execute npm ci. Copie .env.example para .env e preencha os valores reais. No Atlas adicione seu IP atual em Network Access. Execute npm start e abra http://localhost:3000.

## Referências

- https://www.mongodb.com/docs/atlas/connect-to-database-deployment/
- https://render.com/docs/outbound-ip-addresses
- https://render.com/docs/configure-environment-variables
