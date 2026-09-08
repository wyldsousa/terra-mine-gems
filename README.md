# TerraMine Tracker

PROJETO: TerraMine Calculator — Calculadora Completa de Rendimentos



Crie um aplicativo web/PWA moderno, responsivo e profissional chamado TerraMine Calculator.



O aplicativo será uma calculadora independente para jogadores do jogo TerraMine, permitindo cadastrar individualmente suas minas, informar o nível de cada uma e calcular com precisão estimada os rendimentos atuais, futuros e o valor líquido disponível para saque.



IMPORTANTE:



- NÃO criar sistema de login nesta primeira versão.

- NÃO exigir cadastro.

- Os dados do usuário devem ser salvos localmente no dispositivo usando LocalStorage ou IndexedDB.

- O aplicativo deve funcionar perfeitamente em celular.

- Criar também versão desktop responsiva.

- Não copiar identidade visual de outras calculadoras.

- Criar identidade própria inspirada no universo de mineração.

- Não utilizar dados inventados silenciosamente.

- Todos os valores que podem mudar no TerraMine devem ficar centralizados em uma área de CONFIGURAÇÕES/PARÂMETROS para que possam ser atualizados posteriormente sem precisar alterar toda a aplicação.



==================================================



1. OBJETIVO PRINCIPAL

   ==================================================



Criar a calculadora mais completa possível para estimar a renda de um jogador de TerraMine.



O usuário deve conseguir:



1. Cadastrar suas minas.

2. Informar o tipo de cada mina.

3. Informar o nível individual de cada mina.

4. Editar e excluir minas.

5. Visualizar o rendimento de cada mina.

6. Calcular rendimento por segundo.

7. Calcular rendimento por minuto.

8. Calcular rendimento por hora.

9. Calcular rendimento diário.

10. Calcular rendimento semanal.

11. Calcular rendimento mensal.

12. Calcular rendimento anual.

13. Calcular rendimento com boost.

14. Calcular rendimento sem boost.

15. Informar quantas horas de boost utiliza por dia.

16. Calcular o rendimento médio considerando horas com e sem boost.

17. Informar o saldo atual em USD.

18. Calcular quanto o usuário receberia ao sacar.

19. Aplicar automaticamente a taxa de 17%.

20. Permitir configurar impostos/taxas adicionais separadamente.

21. Mostrar valor bruto.

22. Mostrar taxa do TerraMine.

23. Mostrar impostos/taxas adicionais.

24. Mostrar valor líquido estimado.

25. Informar quanto falta para atingir US$1.

26. Informar quanto falta para atingir US$5.

27. Permitir metas personalizadas.

28. Calcular quanto tempo falta para atingir cada meta.

29. Mostrar projeções futuras.

30. Mostrar estatísticas completas da carteira.



==================================================

2. TIPOS DE MINA



Criar quatro tipos de mina:



🪨 ROCK

⚫ COAL

🟡 GOLD

💎 DIAMOND



Usar inicialmente estes multiplicadores relativos:



Rock = 1×

Coal = 1.5×

Gold = 2×

Diamond = 4×



Usar como referência inicial de rendimento mensal de uma mina nível 1, sem boost:



Rock = US$0.002851/mês

Coal = US$0.004147/mês

Gold = US$0.005070/mês

Diamond = US$0.011405/mês



IMPORTANTE:



Esses valores devem ficar em uma configuração central:



CONFIGURAÇÕES > TAXAS DE RENDIMENTO



Não espalhar esses números pelo código.



Criar possibilidade de alteração futura desses valores.



==================================================

3. SISTEMA DE NÍVEIS



Cada mina possui seu próprio nível.



O usuário deve poder cadastrar, por exemplo:



Rock #1 — Level 1

Rock #2 — Level 4

Rock #3 — Level 8



Coal #1 — Level 2

Coal #2 — Level 10



Gold #1 — Level 5



Diamond #1 — Level 3



Cada mina deve ser calculada individualmente.



Regra inicial:



Cada nível acima do nível 1 aumenta o rendimento da mina em 1%.



Fórmula:



Multiplicador do nível = 1 + ((nível - 1) × 0.01)



Exemplo:



Level 1 = 100%

Level 2 = 101%

Level 3 = 102%

Level 10 = 109%

Level 50 = 149%

Level 100 = 199%



Considerar inicialmente nível máximo configurável de 100.



NÃO assumir que todas as minas possuem o mesmo nível.



==================================================

4. CADASTRO INDIVIDUAL DAS MINAS



Criar uma seção chamada:



"Minhas Minas"



Botão:



"+ Adicionar Mina"



Ao adicionar uma mina:



Tipo:



- Rock

- Coal

- Gold

- Diamond



Nível:

campo numérico



Nome opcional:

ex.: "Diamond perto de casa"



ID opcional:



Observação opcional:



Depois de cadastrada, mostrar:



Tipo

Nome

Nível

Rendimento base

Rendimento com nível

Rendimento sem boost

Rendimento com boost

Rendimento diário

Rendimento mensal



Permitir:



Editar

Excluir

Duplicar



Adicionar filtros:



Todas

Rock

Coal

Gold

Diamond



Adicionar ordenação:



Maior rendimento

Menor rendimento

Maior nível

Menor nível

Tipo



==================================================

5. MODO RÁPIDO



Além do cadastro individual, criar uma opção:



"Adicionar por quantidade"



Exemplo:



Rock: 50 minas

Nível médio: 3



Coal: 20 minas

Nível médio: 4



Gold: 5 minas

Nível médio: 2



Diamond: 1 mina

Nível médio: 1



Isso deve ser apenas um modo rápido.



O modo detalhado continua permitindo cadastrar cada mina individualmente.



==================================================

6. CÁLCULO DE BOOST



Criar seção:



"Boost de Rendimento"



Boost padrão:



20×



Permitir configurar:



0 horas

1 hora

2 horas

3 horas

4 horas

5 horas

6 horas

7 horas

8 horas

ou valor personalizado.



O aplicativo deve considerar que:



Durante as horas com boost:

rendimento = rendimento normal × 20



Durante as horas sem boost:

rendimento = rendimento normal



Fórmula diária:



Renda diária =

(renda por hora × horas com boost × multiplicador)

+

(renda por hora × horas sem boost)



Onde:



horas sem boost = 24 - horas com boost



IMPORTANTE:



O aplicativo não deve simplesmente multiplicar a renda diária inteira por 20 se o usuário informar apenas algumas horas de boost.



Exemplo:



8h de boost + 16h sem boost.



Calcular:



8 × renda × 20

+

16 × renda × 1



Também permitir opção:



"Boost 24 horas"



==================================================

7. PAINEL PRINCIPAL



Criar Dashboard.



No topo mostrar:



💰 Rendimento estimado



$X.XXXX / mês



Depois:



Hoje

Esta semana

Este mês

Este ano



Criar cards:



Rendimento por segundo

Rendimento por minuto

Rendimento por hora

Rendimento diário

Rendimento semanal

Rendimento mensal

Rendimento anual



Mostrar também:



Total de minas

Rock

Coal

Gold

Diamond



Nível médio geral.



Boost diário configurado.



==================================================

8. COMPARAÇÃO COM E SEM BOOST



Criar card:



"Impacto do Boost"



Mostrar:



Sem boost:

$X / dia

$X / mês

$X / ano



Com boost:

$X / dia

$X / mês

$X / ano



Lucro adicional do boost:



+$X / dia

+$X / mês

+$X / ano



Também mostrar:



"Seu boost aumenta sua renda em X%."



==================================================

9. SALDO ATUAL E SAQUE



Criar seção:



"Calculadora de Saque"



Campo:



Saldo atual:

US$ ______



Taxa do TerraMine:



17%



Permitir editar essa porcentagem nas configurações.



Imposto/taxa adicional:



Campo configurável.



Exemplo:



Imposto adicional = X%



Calcular automaticamente:



Saldo bruto



- Taxa TerraMine (17%)

- Imposto/taxa adicional

  = Valor líquido estimado



Exemplo visual:



Saldo bruto:

$10.00



Taxa TerraMine (17%):

-$1.70



Impostos/taxas adicionais:

-$X.XX



Você receberá aproximadamente:

$X.XX



IMPORTANTE:



A taxa de 17% deve ser tratada separadamente dos impostos.



Nunca misturar os dois.



Criar também:



"Quanto preciso ter no saldo para receber US$1 líquido?"



"Quanto preciso ter no saldo para receber US$5 líquidos?"



"Quanto preciso ter no saldo para receber US$10 líquidos?"



Permitir metas personalizadas.



==================================================

10. METAS



Criar seção:



"Metas de Rendimento"



Metas padrão:



US$1

US$5

US$10

US$25

US$50

US$100

US$500

US$1.000



Para cada meta mostrar:



Rendimento necessário

Tempo estimado

Dias

Semanas

Meses



Exemplo:



Meta: US$5



Rendimento atual:

US$0.20/dia



Tempo estimado:

25 dias



Também mostrar:



Data estimada para atingir a meta.



Se o saldo atual já tiver parte da meta, considerar o saldo existente.



==================================================

11. CONTAGEM REGRESSIVA PARA METAS



Se o usuário informar:



Saldo atual = US$2.35



Meta = US$5.00



Rendimento diário = US$0.15



Calcular:



Falta:

US$2.65



Tempo estimado:

17.67 dias



Mostrar também:



"Você deve atingir sua meta aproximadamente em DD/MM/YYYY."



==================================================

12. PROJEÇÕES



Criar seção:



"Projeção de Rendimentos"



Permitir escolher:



7 dias

30 dias

60 dias

90 dias

6 meses

1 ano

2 anos

5 anos



Mostrar gráfico de crescimento.



Considerar:



Saldo inicial

+

rendimento projetado



Permitir escolher:



Com boost

Sem boost

Boost personalizado



==================================================

13. CALCULADORA DE COMPRA DE MINAS



Criar seção:



"Simulador de Expansão"



Pergunta:



"Se eu adicionar mais minas, quanto vou ganhar?"



Campos:



Quantidade de Rock

Quantidade de Coal

Quantidade de Gold

Quantidade de Diamond



Nível dessas novas minas.



Calcular:



Rendimento adicional diário

Rendimento adicional mensal

Rendimento adicional anual



Mostrar:



Renda atual

Renda após compra

Diferença



Exemplo:



Atual:

$5/mês



Depois:

$7.50/mês



Aumento:

+$2.50/mês



==================================================

14. SIMULADOR DE NÍVEL



Criar seção:



"Simulador de Upgrade"



Usuário escolhe uma mina.



Mostrar:



Nível atual

Nível desejado



Calcular:



Rendimento atual

Rendimento depois do upgrade

Diferença diária

Diferença mensal

Diferença anual



Exemplo:



Level 5 → Level 10



Mostrar aumento percentual:



+5%



==================================================

15. ESTATÍSTICAS DAS MINAS



Criar gráficos:



Distribuição por tipo.



Exemplo:



Rock 60%

Coal 30%

Gold 8%

Diamond 2%



Mostrar também:



Quantidade total

Porcentagem de cada tipo

Rendimento gerado por cada tipo



Criar gráfico:



"Quem mais gera dinheiro?"



Rock

Coal

Gold

Diamond



Mostrar tanto quantidade quanto rendimento.



==================================================

16. RENDIMENTO POR MINA



Criar ranking:



"Minhas minas mais lucrativas"



Exemplo:



🥇 Diamond #3

Level 15

$0.XX/mês



🥈 Gold #7

Level 20

$0.XX/mês



🥉 Coal #4

Level 30

$0.XX/mês



Permitir ordenar por:



Rendimento diário

Rendimento mensal

Nível

Tipo



==================================================

17. MÉDIA DA CARTEIRA



Mostrar:



Nível médio das minas.



Nível médio Rock.

Nível médio Coal.

Nível médio Gold.

Nível médio Diamond.



Também mostrar:



Rendimento médio por mina.



==================================================

18. CALCULADORA DE TEMPO



Criar calculadora:



"Quanto tempo para ganhar..."



Campo:



Valor desejado:



US$ ______



Considerar:



Saldo atual

Rendimento diário

Boost



Resultado:



Dias

Horas

Minutos



Exemplo:



Para ganhar US$1:

X dias



Para ganhar US$5:

X dias



Para ganhar US$10:

X dias



==================================================

19. CONVERSÃO DE RENDIMENTO



Mostrar automaticamente:



Por segundo

Por minuto

Por hora

Por 24 horas

Por 7 dias

Por 30 dias

Por 365 dias



Usar 30 dias para projeção mensal e 365 dias para anual, deixando isso claramente indicado.



==================================================

20. CONFIGURAÇÕES



Criar página:



Configurações



Categorias:



RENDIMENTOS



Rock:

US$0.002851/mês



Coal:

US$0.004147/mês



Gold:

US$0.005070/mês



Diamond:

US$0.011405/mês



BOOST



Multiplicador:

20×



SAQUE



Taxa do TerraMine:

17%



Imposto adicional:

0% inicialmente



LIMITES



Nível máximo:

100



PERÍODOS



Dias considerados no mês:

30



Dias considerados no ano:

365



IMPORTANTE:



Exibir aviso:



"Os valores são estimativas e podem mudar conforme alterações no TerraMine. Atualize os parâmetros quando houver mudanças oficiais."



==================================================

21. IMPORTAÇÃO E EXPORTAÇÃO



Criar:



Exportar dados



Importar dados



Exportar em JSON.



Permitir que o usuário faça backup das suas minas.



Criar também:



"Restaurar dados"



"Apagar todos os dados"



Antes de apagar:



mostrar confirmação.



==================================================

22. INTERFACE



Criar interface premium.



Tema:



Dark mode como padrão.



Estilo:



moderno

futurista

mineração

profissional



Usar:



cards

gráficos

ícones

animações discretas

gradientes

efeitos de profundidade



Não exagerar nas animações.



A interface precisa ser extremamente rápida.



Mobile-first.



Navegação inferior no celular:



🏠 Dashboard

⛏️ Minhas Minas

🧮 Calculadora

📊 Estatísticas

⚙️ Configurações



No desktop:



sidebar.



==================================================

23. DASHBOARD MOBILE



No celular, a primeira informação deve ser:



💰 Rendimento mensal



Depois:



Rendimento diário



Depois:



Saldo atual



Depois:



Progresso até US$1



Depois:



Progresso até US$5



Depois:



Quantidade de minas.



==================================================

24. INDICADORES IMPORTANTES



Criar indicadores:



💰 Rendimento mensal



📈 Crescimento mensal



⛏️ Total de minas



⚡ Boost diário



🎯 Próxima meta



💵 Saldo atual



🏆 Mina mais lucrativa



==================================================

25. PRECISÃO DOS CÁLCULOS



Não arredondar internamente os cálculos.



Usar valores de alta precisão.



Arredondar apenas na apresentação.



Para valores muito pequenos:



mostrar até 8 casas decimais quando necessário.



Exemplo:



$0.00001234



Não transformar automaticamente em $0.00.



==================================================

26. TRANSPARÊNCIA



Criar uma seção:



"Como calculamos?"



Explicar claramente:



Rendimento base

+

multiplicador do tipo

+

nível da mina

+

boost



rendimento estimado



Mostrar a fórmula utilizada.



Isso é importante para o usuário confiar na calculadora.



==================================================

27. AVISOS



Sempre mostrar quando apropriado:



"Esta calculadora fornece estimativas e não garante pagamentos."



"Os rendimentos podem variar."



"Taxas e impostos podem mudar."



"Confira as regras atuais do TerraMine antes de realizar um saque."



==================================================

28. ARQUITETURA



Usar:



React

TypeScript

Tailwind CSS

shadcn/ui



Criar código organizado.



Separar:



components

pages

calculations

data

hooks

utils

types



Criar um módulo específico:



src/calculations/terraMineCalculator.ts



Esse módulo deve conter TODAS as fórmulas.



Não colocar fórmulas complexas diretamente nos componentes visuais.



==================================================

29. MOTOR DE CÁLCULO



Criar funções:



calculateMineMonthlyIncome()



calculateMineDailyIncome()



calculateMineHourlyIncome()



calculateMineIncomeWithBoost()



calculatePortfolioIncome()



calculateWithdrawal()



calculateNetWithdrawal()



calculateGoalTime()



calculateProjection()



calculateUpgradeImpact()



calculateExpansionImpact()



calculateAverageMineLevel()



calculateMineDistribution()



Todas devem ser testáveis.



==================================================

30. TESTES



Criar testes para o motor de cálculo.



Testar:



1 Rock nível 1.



1 Coal nível 1.



1 Gold nível 1.



1 Diamond nível 1.



Múltiplas minas.



Minas com níveis diferentes.



0 horas de boost.



8 horas de boost.



24 horas de boost.



Saldo de US$1.



Saldo de US$5.



Taxa de 17%.



Imposto adicional.



Meta já atingida.



Meta ainda não atingida.



Valores extremamente pequenos.



==================================================

31. RESPONSIVIDADE



O aplicativo deve funcionar perfeitamente em:



Android

iPhone

Tablet

Desktop



Não permitir:



scroll horizontal

botões cortados

texto sobreposto

gráficos quebrados

cards ultrapassando a tela.



==================================================

32. PWA



Transformar em PWA.



Permitir:



Adicionar à tela inicial.



Funcionar offline para cálculos.



Salvar dados localmente.



==================================================

33. IDIOMAS



Preparar o aplicativo para:



🇧🇷 Português

🇺🇸 English



Português como idioma inicial.



Criar seletor de idioma em Configurações.



NÃO colocar textos diretamente espalhados pelo código.



Centralizar traduções.



==================================================

34. SISTEMA DE ATUALIZAÇÃO DE PARÂMETROS



Criar uma estrutura que permita futuramente atualizar:



rendimento Rock

rendimento Coal

rendimento Gold

rendimento Diamond

boost

taxa de saque

nível máximo

dias do mês

dias do ano



sem precisar reconstruir toda a aplicação.



==================================================

35. IMPORTANTE SOBRE DADOS OFICIAIS



Não apresentar valores comunitários como se fossem necessariamente valores oficiais.



Marcar claramente os valores como:



"Valor de referência"



quando não forem oficialmente confirmados.



Separar:



Dados oficiais conhecidos

Dados de referência da comunidade

Configurações personalizadas do usuário



==================================================

36. DESIGN FINAL



O aplicativo deve parecer um produto profissional pronto para publicação.



Criar:



Logo simples com elemento de mineração.



Nome:



TerraMine Calculator



Subtítulo:



"Know your mines. Know your earnings."



No português:



"Conheça suas minas. Conheça seus ganhos."



Criar uma experiência visual agradável e intuitiva.



==================================================

37. REGRA PRINCIPAL



NÃO simplifique o projeto.



NÃO remova funcionalidades para facilitar a implementação.



Primeiro construa a estrutura completa.



Depois verifique todas as funcionalidades.



Faça uma revisão final procurando:



- erros matemáticos

- erros de arredondamento

- campos que não salvam

- botões que não funcionam

- problemas no celular

- problemas nos gráficos

- problemas de navegação

- dados que desaparecem após atualizar a página



O aplicativo deve estar completamente funcional.



==================================================

38. RESULTADO ESPERADO



Ao final, o usuário deverá conseguir abrir o aplicativo e:



1. cadastrar todas as suas minas individualmente;

2. colocar o nível de cada mina;

3. visualizar quanto cada mina produz;

4. saber quanto ganha por segundo;

5. saber quanto ganha por minuto;

6. saber quanto ganha por hora;

7. saber quanto ganha por dia;

8. saber quanto ganha por semana;

9. saber quanto ganha por mês;

10. saber quanto ganha por ano;

11. comparar boost e sem boost;

12. informar seu saldo atual;

13. calcular quanto receberá após a taxa de 17%;

14. adicionar impostos separadamente;

15. descobrir quanto falta para US$1;

16. descobrir quanto falta para US$5;

17. descobrir quanto tempo leva para atingir essas metas;

18. simular novas minas;

19. simular upgrades;

20. acompanhar toda a evolução da sua carteira.



A prioridade absoluta é:



PRECISÃO + COMPLETUDE + FACILIDADE DE USO + EXPERIÊNCIA MOBILE.



Antes de considerar o projeto concluído, revise todas as funcionalidades e garanta que nenhuma delas seja apenas visual ou fictícia.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://terra-mine-gems.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c5b1371e-d9a0-480e-86bb-f6b3ab28d8cb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
