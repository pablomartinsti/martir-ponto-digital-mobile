# Ajustes realizados

## Ponto digital

- Corrigido o fluxo após bater ponto: depois de cada ação, o app consulta novamente a API e atualiza o estado real da jornada.
- Corrigido o risco de perder `recordId` após a entrada.
- Botão fica bloqueado enquanto busca GPS ou envia o ponto.
- Mensagens de alerta foram trocadas por textos mais claros: ponto já registrado, localização não autorizada, intervalo e jornada não encontrada.
- Correção do cálculo da data usando `America/Sao_Paulo`.

## Layout Android

- Tela de ponto ajustada com `SafeAreaView`.
- Conteúdo principal com `ScrollView` para não cortar em telas pequenas.
- Relógio agora usa tamanho proporcional à largura da tela.
- Menu inferior respeita a área segura do Android.
- Telas de dia, semana e mês também foram ajustadas com área segura e scroll.

## Expo/EAS

- Removido `newArchEnabled` do `app.json`, pois causava erro no `expo doctor`.
- Adicionada a dependência `react-native-worklets@^0.8.3`, exigida pelo `react-native-reanimated`.
- Substituído `react-native-vector-icons` por `@expo/vector-icons`.

## Validação feita

- `npx tsc --noEmit` executado com sucesso.
- `npx expo-doctor` passou em 19/21 verificações. As 2 falhas restantes ocorreram por falta de acesso à API externa do Expo no ambiente de geração, não por erro local do projeto.
