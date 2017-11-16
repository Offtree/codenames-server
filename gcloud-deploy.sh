cd ../client; npm install; npm run build; cp -r build ../server/build; cd -;
gcloud app deploy;
rm -rf build