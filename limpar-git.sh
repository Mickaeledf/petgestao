#!/bin/bash
cd "$(dirname "$0")"

echo "=== Criando repositorio limpo ==="

# Remover referencia ao .git antigo do Desktop
# Criar um .git proprio dentro de petgestao
rm -rf .git
git init
git remote add origin https://github.com/Mickaeledf/petgestao.git

# Adicionar todos os arquivos (exceto node_modules e .env)
git add -A

# Commit limpo
git -c user.name="Mickaeledf" -c user.email="109925078+Mickaeledf@users.noreply.github.com" commit -m "feat: implement PetGestao - complete pet shop management system"

# Push forcado
git branch -M main
git push origin main --force

echo ""
echo "=== PRONTO! Repositorio limpo no GitHub ==="
echo "Arquivos agora na raiz, sem pastas pessoais."
echo "Pressione qualquer tecla para fechar..."
read -n 1
