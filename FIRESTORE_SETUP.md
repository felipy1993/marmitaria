# 🔒 Como Configurar as Permissões do Firestore

## ⚠️ Erro Atual
```
FirebaseError: Missing or insufficient permissions
```

Este erro acontece porque as regras de segurança do Firestore não estão configuradas corretamente.

## 📋 Passo a Passo para Corrigir

### 1. Acesse o Firebase Console
- Vá para: https://console.firebase.google.com
- Selecione seu projeto "Marmitaria"

### 2. Configure as Regras do Firestore
1. No menu lateral, clique em **"Firestore Database"**
2. Clique na aba **"Regras"** (Rules)
3. **Copie todo o conteúdo** do arquivo `firestore.rules` que está na raiz do projeto
4. **Cole** no editor de regras do Firebase Console
5. Clique em **"Publicar"** (Publish)

### 3. Aguarde a Propagação
- As regras podem levar alguns segundos para serem aplicadas
- Recarregue a página da loja após publicar

## 🎯 O que as Regras Fazem

### ✅ Permissões Públicas (Leitura)
- **Produtos**: Qualquer pessoa pode ver
- **Configurações**: Qualquer pessoa pode ver
- **Cupons**: Qualquer pessoa pode ver

### 🔐 Permissões de Usuário
- **Pedidos**: 
  - Qualquer pessoa pode **criar** pedidos (guest ou autenticado)
  - Usuários só podem **ver seus próprios** pedidos
  - Guests podem ver pedidos com seu `guestId`

### 👑 Permissões de Admin
- **Produtos**: Criar, editar, deletar
- **Pedidos**: Ver todos, atualizar status, deletar
- **Vendas, Despesas, Estoque**: Acesso total

## 🚨 Importante

### Regras Temporárias para Desenvolvimento (NÃO RECOMENDADO PARA PRODUÇÃO)
Se você quiser apenas testar rapidamente, pode usar estas regras **TEMPORÁRIAS**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **ATENÇÃO**: Estas regras permitem que qualquer pessoa leia e escreva em todo o banco de dados. Use apenas para testes locais e **NUNCA em produção**!

## ✅ Verificação

Após configurar as regras, teste:
1. Abra a loja
2. Clique em "Meus Pedidos"
3. O erro não deve mais aparecer

Se o erro persistir:
- Verifique se as regras foram publicadas corretamente
- Aguarde 1-2 minutos para propagação
- Limpe o cache do navegador (Ctrl + Shift + Delete)
- Recarregue a página (F5)
