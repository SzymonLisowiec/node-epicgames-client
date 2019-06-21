#!/usr/bin/env sh

# abort on errors
set -e

# build
vuepress build docs

# navigate into the build output directory
cd docs/.vuepress/dist

# if you are deploying to a custom domain
# echo 'www.example.com' > CNAME
echo "epicgames-client.kysune.me" >> "CNAME"

git init
git add -A
git commit -m 'deploy'

git push -u -f https://github.com/SzymonLisowiec/node-epicgames-client master:gh-pages

cd -