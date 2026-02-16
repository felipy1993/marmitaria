
# Marmita Express - Sistema de Pedidos Online

Um sistema completo e profissional para gestão de pedidos de marmitarias, desenvolvido com React, Firebase e Tailwind CSS.

## 🚀 Funcionalidades

- **Cardápio Online:** Listagem automática de produtos ativos.
- **Carrinho de Compras:** Experiência fluida para o cliente adicionar e remover itens.
- **Checkout Simples:** Coleta de dados de entrega e forma de pagamento manual (Pix, Dinheiro, Cartão).
- **Painel Admin:** Protegido por autenticação para gerenciar o negócio.
- **Real-time:** Pedidos aparecem instantaneamente para o administrador via Firestore Snapshots.
- **Gestão de Produtos:** CRUD completo para ativar/desativar pratos do cardápio.

## 🛠 Configuração do Firebase

1.  Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2.  Ative o **Firestore Database** em modo de teste ou com as regras abaixo.
3.  Ative o **Authentication** com o método `E-mail/Senha`.
4.  Crie um usuário no Authentication para ser o seu admin.
5.  Copie suas credenciais e substitua no arquivo `firebase-config.ts`.

### Regras de Segurança (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /orders/{orderId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
  }
}
```

### 💡 Nota sobre Índices
Para manter a simplicidade e evitar erros no plano gratuito, a ordenação dos produtos ativos é feita no lado do cliente (Frontend). Isso evita o erro de "The query requires an index". Se o seu cardápio tiver mais de 500 itens, considere criar o índice composto no console do Firebase e retornar a ordenação para o `query()` no arquivo `database.ts`.

## 💻 Como Rodar Localmente

1.  Instale as dependências: `npm install`
2.  Inicie o servidor de desenvolvimento: `npm start`
3.  Acesse `http://localhost:3000`

---
Desenvolvido por Arquiteto Sênior de Sistemas Web.
