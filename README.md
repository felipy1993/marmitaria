
# Marmita Express - Sistema de Pedidos Online

Um sistema completo e profissional para gestão de pedidos de marmitarias, desenvolvido com React, Firebase e Tailwind CSS.

## 🚀 Funcionalidades

- **Cardápio Online:** Listagem automática de produtos ativos com personalização.
- **Login Opcional (Google):** Clientes podem logar para preenchimento automático.
- **Carrinho e Edição:** Usuários podem editar itens já adicionados antes de fechar o pedido.
- **Painel Admin Seguro:** Acesso restrito via E-mail/Senha (Logins via Google são bloqueados no painel).
- **Logística Geográfica:** Cálculo de distância e bloqueio por raio de entrega.

## 🛠 Configuração do Firebase

1.  Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2.  Ative o **Firestore Database**.
3.  Ative o **Authentication** com os métodos:
    - `E-mail/Senha` (Para o Admin)
    - `Google` (Para os Clientes)
4.  **IMPORTANTE (ERRO DE DOMÍNIO):**
    Para que o login com Google funcione, você deve autorizar o domínio onde o site está rodando:
    - Vá em `Authentication` -> `Settings` -> `Authorized Domains`.
    - Clique em `Add Domain` e adicione o endereço do seu site (Ex: `seu-site.vercel.app` ou o domínio temporário do preview).
5.  Copie suas credenciais e substitua no arquivo `firebase-config.ts`.

### Regras de Segurança (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.firebase.sign_in_provider == 'password';
    }
    match /orders/{orderId} {
      allow create: if true;
      allow read, update: if request.auth != null && request.auth.token.firebase.sign_in_provider == 'password';
    }
    match /settings/{docId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.firebase.sign_in_provider == 'password';
    }
  }
}
```

## 💻 Como Rodar Localmente

1.  Instale as dependências: `npm install`
2.  Inicie o servidor de desenvolvimento: `npm start`
3.  Acesse `http://localhost:3000`
