# 👑 Como Corrigir Permissões de Admin (Passo 2)

O problema é que o seu usuário de Login no Admin **não está marcado como Admin** no banco de dados do Firebase.

Por isso, mesmo logado, o sistema (Firestore) bloqueia o acesso aos dados sensíveis.

## ✅ Solução Rápida (Já implementada)

Eu acabei de atualizar o arquivo `firestore.rules` para ser mais permissivo na leitura.
1. **Copie novamente** o conteúdo do arquivo `firestore.rules`.
2. **Cole no Firebase Console** > Firestore Database > Rules.
3. **Publique**.
4. Recarregue a página do Admin.

Isso deve fazer os pedidos aparecerem imediatamente.

---

## 🔒 Solução Permanente e Segura (Recomendada)

Para que você possa **editar status, deletar pedidos e criar produtos**, seu usuário precisa ser *oficialmente* um admin.

Como fazer isso sem backend:

1. Vá no arquivo `firestore.rules` e procure a linha onde diz `allow update:...` e, **temporariamente**, mude para `if true;`. Publique no Firebase.
2. No seu app (navegador), abra o Console do Desenvolvedor (F12).
3. Cole este código no Console e aperte Enter (substitua pelo seu email de admin):

```javascript
/* Script para setar Admin via Frontend (Requer regras 'active' temporariamente) */
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const auth = getAuth();
const db = getFirestore();
const user = auth.currentUser;

if (user) {
  // Cria um documento na coleção 'users' com a flag isAdmin
  await setDoc(doc(db, "users", user.uid), {
    email: user.email,
    isAdmin: true
  }, { merge: true });
  console.log("✅ Usuário " + user.email + " agora é Admin na coleção 'users'!");
} else {
  console.log("❌ Você precisa estar logado no app para rodar isso!");
}
```

4. Após ver a mensagem de sucesso, volte no `firestore.rules`.
5. Mude a regra para checar o documento do usuário ao invés do token:

```javascript
// Substitua "request.auth.token.admin == true" por:
// get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true
```

Mas por enquanto, a **Solução Rápida** acima já vai destravar seu painel!
