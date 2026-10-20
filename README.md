# Controle de validade — Casa de Madeira

Projeto básico para apoiar o cadastro de alimentos e o acompanhamento das datas de vencimento do restaurante Casa de Madeira.

## Como usar

1. Mantenha `index.html`, `style.css` e `script.js` na mesma pasta.
2. Abra `index.html` no navegador.
3. Cadastre o nome, a quantidade, a unidade e a data de vencimento do alimento.
4. Consulte os alertas, busque pelo nome ou filtre pela situação.
5. Use **Editar**, **Excluir** ou **Exportar CSV** quando necessário.

## Funcionalidades

- Cadastro e edição de alimentos e lotes com vencimentos diferentes.
- Quantidades com até duas casas decimais.
- Listagem ordenada pelo vencimento mais próximo.
- Indicadores de total de cadastros, vencidos e vencimentos entre hoje e os próximos três dias.
- Busca por nome e filtro por situação.
- Exclusão com confirmação.
- Salvamento no navegador por meio de localStorage.
- Exportação dos cadastros em CSV para consulta em planilhas.
- Layout adaptado para computador e celular.

## Tecnologias

HTML estrutura a página, CSS define a aparência e JavaScript realiza os cadastros, filtros e cálculos. O projeto não utiliza bibliotecas externas nem exige instalação.

## Limitações

Os dados pertencem ao navegador e ao computador utilizados. Não há conta de usuário, sincronização, banco de dados no servidor ou notificações com a página fechada. Limpar os dados do navegador pode apagar os cadastros. A disponibilidade de localStorage para arquivos abertos diretamente pode variar entre navegadores. O sistema avisa se não conseguir salvar. O CSV exportado serve para consulta e não possui importação automática de volta para o sistema.

O indicador considera apenas a data cadastrada. O prazo de três dias é uma configuração de alerta do projeto, não uma avaliação das condições do alimento.

## Sugestão de aplicação na atividade de extensão

Apresentar a ferramenta ao responsável pelo restaurante, cadastrar os alimentos com as datas reais fornecidas pelo estabelecimento, orientar o uso e registrar as atividades efetivamente realizadas. Para o relatório acadêmico, preencher os dados do aluno, curso, instituição, período e carga horária conforme as regras da faculdade. Este código não comprova a execução da atividade nem garante a validação das horas.
