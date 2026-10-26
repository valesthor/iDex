# iDex — despensa virtual

App mobile-first e 100% offline (PWA) para controlar o estoque da casa e montar a lista da feira.
HTML + CSS + JS puros, sem build e sem dependências.

## Como funciona

- **Despensa**: seus produtos ficam em prateleiras (categorias), como capas em um leitor de ebooks. A bolinha na capa mostra o estoque (verde = ok, amarelo = acabando, vermelho = acabou).
- **Toque em um produto** para ajustar *quanto tenho* e *quanto quero ter* (nível ideal).
- **Lista**: montada sozinha com `ideal − estoque`. Ajuste as quantidades, marque o que foi para o carrinho e toque em **Concluir feira** — o que foi comprado entra no estoque.
- **Ajustes**: temas Papel / Sépia / Noite, gerenciar prateleiras, backup (exportar/importar JSON).
- Fotos são redimensionadas no aparelho (360×480) e salvas em IndexedDB. Nada sai do celular.

## Publicar no GitHub Pages

1. Crie um repositório e envie **o conteúdo desta pasta** na raiz (`index.html`, `app.js`, `style.css`, `sw.js`, `manifest.webmanifest`, `icons/`).
2. Em **Settings → Pages**, escolha *Deploy from a branch*, branch `main`, pasta `/ (root)`.
3. Abra `https://SEU-USUARIO.github.io/NOME-DO-REPO/` no celular e use **Adicionar à tela inicial** (Chrome: "Instalar app").

Todos os caminhos são relativos, então funciona em subpasta do GitHub Pages.

## Atualizando o app

O service worker usa cache primeiro e atualiza em segundo plano. Depois de publicar mudanças, abra o app duas vezes
(ou aumente `VERSION` em `sw.js`, ex.: `idex-v2`, para forçar a troca do cache).

## Estrutura

```
index.html            casca do app
style.css             temas e layout (prateleiras, sheets)
app.js                estado, telas, IndexedDB, backup
sw.js                 cache offline
manifest.webmanifest  instalação como app
icons/                favicon e ícones (SVG + PNG, maskable, apple-touch)
```
