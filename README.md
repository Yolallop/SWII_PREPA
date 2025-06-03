NIA 	NIA	116171

cd setup
sh setup.sh       # instala MongoDB local y herramientas
sh db.sh          # importa los datasets a MongoDB

mongosh
show collections
db.cards.find().pretty()


cd ../api
npm install
npm audit fix
npm start
http://localhost:3000/api/books


bash
Copiar
Editar
http://localhost:3000/api/books
También puedes probar con un ID:

bash
Copiar
Editar
http://localhost:3000/api/card/01087

EADME — Examen Sistemas Web 2 (usuario: y.llop, NIA: 116171)
🔒 Evitar pedir la contraseña todo el rato
bash
Copiar
Editar
git config credential.helper "cache --timeout=7200"
👤 Configuración de Git
bash
Copiar
Editar
git config --global user.name "y.llop"
git config --global user.email y.llop@usp.ceu.es
⬇️ Clonar el repositorio
bash
Copiar
Editar
git clone https://git.eps.ceu.es/sw2/examen/y.llop
🧑‍💻 Usuario y contraseña
Usuario: y.llop

Correo: y.llop@usp.ceu.es

Contraseña: 116171

⚙️ Preparar entorno (setup)
bash
Copiar
Editar
cd setup
sh setup.sh      # instala MongoDB local + herramientas
sh db.sh         # importa datasets a MongoDB
✅ Comprobar que todo está correcto (MongoDB)
bash
Copiar
Editar
mongosh
use sw2
show collections
db.cards.find().pretty()
Si ves documentos, está bien cargado.

🚀 Arrancar el servidor
bash
Copiar
Editar
cd ../api
npm install
npm audit fix
npm start
El servidor se ejecuta en: http://localhost:3000

🌐 Comprobar que la API funciona
Desde navegador o Postman:

Lista de cartas:
http://localhost:3000/api/cards

Carta por ID (ejemplo):
http://127.0.0.1:3000/api/card/01087

🧩 Añadir extensión de MongoDB en VS Code
Instala extensión: MongoDB for VS Code

Haz clic en el icono de MongoDB (izquierda).

Clic en + (nueva conexión)

Elige Connect with Connection String

Pega:

bash
Copiar
Editar
mongodb://127.0.0.1/sw2
🔍 Ver datos en el navegador
También puedes abrir este enlace en Chrome:

ruby
Copiar
Editar
http://127.0.0.1:3000/api/card/01087
