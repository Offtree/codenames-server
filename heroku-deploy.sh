cd ../client; npm install; npm run build; cp -r build ../server/build; cd -;
git add .
git commit -am "Deploy to heroku"
push -f heroku master
git reset --hard origin/master