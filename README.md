
# Marmita Express - Sistema de Pedidos Online

## 🛠 Como rodar no seu computador (Local)

Para que o banco de dados funcione localmente, siga estes passos obrigatórios:

### 1. Preparar o Ambiente
No terminal da sua pasta, execute:
```bash
npm install
```

### 2. CONFIGURAÇÃO CRÍTICA (Firebase Console)
O Firebase bloqueia conexões locais por segurança. Você precisa autorizar seu computador:
1. Acesse o [Firebase Console](https://console.firebase.google.com/).
2. Vá em **Authentication** -> aba **Settings**.
3. Clique em **Authorized Domains** (Domínios Autorizados).
4. Clique em **Add Domain**.
5. Adicione: `localhost`
6. Se estiver usando uma porta específica (ex: 5173), o Firebase já reconhece apenas o `localhost`.

### 3. Executar o Sistema
```bash
npm run dev
```

### 💡 Dica de Especialista
Se mesmo assim os dados não aparecerem, verifique as **Regras do Firestore** no console do Firebase. Para testes iniciais, você pode deixá-las em modo público (embora não recomendado para produção):

```javascript
allow read, write: if true;
```

---

## 🚀 Estrutura
- **Store.tsx**: Interface do cliente.
- **AdminDashboard.tsx**: Saúde financeira e métricas.
- **AdminOrders.tsx**: Gestão operacional de pedidos (Cozinha).
- **AdminFinances.tsx**: Fluxo de caixa e despesas manuais.
