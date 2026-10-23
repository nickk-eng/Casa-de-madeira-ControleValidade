# Casa de Madeira — Controle de validade

Aplicação Node.js com PostgreSQL. Cadastro, edição, exclusão, filtros e exportação CSV. A tabela é criada automaticamente ao iniciar o servidor. Acesso protegido por senha compartilhada: no navegador informe qualquer nome de usuário e a senha APP_PASSWORD.

## Publicar no Render

1. Crie um repositório no GitHub e envie os arquivos desta pasta, incluindo package.json, server.js, schema.sql e render.yaml. Não envie .env ou node_modules.
2. No Render, selecione New > Blueprint e conecte esse repositório.
3. O Render lerá render.yaml e preparará o serviço e o PostgreSQL. Informe uma senha forte em APP_PASSWORD e confira os planos e custos antes de confirmar.
4. Aguarde a publicação e abra o endereço do serviço. Entre com qualquer usuário e a senha definida.
5. Cadastre um alimento, recarregue a página, edite e exclua para conferir o banco.

Alternativa manual: crie um Render Postgres e um Web Service Node na mesma região. Build Command: npm install. Start Command: npm start. Configure DATABASE_URL com a Internal Database URL do PostgreSQL e APP_PASSWORD com uma senha forte.

## Rodar localmente

Instale Node.js 22 ou superior e PostgreSQL. Execute npm install. Copie .env.example para .env e ajuste os valores. Execute node --env-file=.env server.js e abra http://localhost:3000.

## Dados e acesso

Os registros são compartilhados entre os dispositivos com acesso à senha. Os cadastros antigos do navegador não são transferidos automaticamente: exporte o CSV na versão antiga para preservar uma cópia e recadastre-os na versão publicada. Exporte cópias periódicas. Confira as condições e a validade do banco gratuito no Render; ele não deve ser tratado como armazenamento permanente sem verificar o plano. A senha compartilhada não oferece contas individuais nem histórico de alterações.

## Verificação

Sintaxe do servidor e do navegador verificada com Node. A integração com PostgreSQL precisa ser validada após configurar uma instância real e DATABASE_URL.

