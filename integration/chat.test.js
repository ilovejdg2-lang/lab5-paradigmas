require('./setup-env');

var http = require('http');
var { start, io: ioServer, preparePromise } = require('../server');
var { io: ioClient } = require('socket.io-client');
var { signAccessToken } = require('../test/helpers/test-jwt');

var puerto = 0;

function getRoot(port) {
  return new Promise(function (resolve, reject) {
    http.get({ hostname: '127.0.0.1', port: port, path: '/' }, function (res) {
      var body = '';
      res.on('data', function (chunk) { body += chunk; });
      res.on('end', function () {
        resolve({ status: res.statusCode, body: body });
      });
    }).on('error', reject);
  });
}

function abrirCliente(port, token) {
  return new Promise(function (resolve, reject) {
    var socket = ioClient('http://127.0.0.1:' + port, {
      transports: ['websocket'],
      forceNew: true,
      auth: token ? { token: token } : {}
    });
    socket.once('connect', function () { resolve(socket); });
    socket.once('connect_error', function (err) {
      reject(err);
    });
  });
}

function esperarMensaje(socket) {
  return new Promise(function (resolve) {
    socket.once('Evento-Mensaje-Server', resolve);
  });
}

function enviar(socket, mensaje, nombre) {
  socket.emit('Evento-Mensaje-Server', JSON.stringify({
    nombre: nombre || 'Intruso',
    color: '#112233',
    mensaje: mensaje
  }));
}

function expectConnectError(port, token) {
  return new Promise(function (resolve, reject) {
    var socket = ioClient('http://127.0.0.1:' + port, {
      transports: ['websocket'],
      forceNew: true,
      auth: token ? { token: token } : {}
    });
    socket.once('connect', function () {
      socket.close();
      reject(new Error('La conexión anónima o inválida no debió aceptarse'));
    });
    socket.once('connect_error', function (err) {
      socket.close();
      resolve(err);
    });
  });
}

describe('chat por socket', function () {
  var sockets = [];
  var tokenAna;
  var tokenAna2;

  beforeAll(async function () {
    await preparePromise;
    tokenAna = await signAccessToken({ sub: 'auth0|ana', name: 'Ana', email: 'ana@example.com' });
    tokenAna2 = await signAccessToken({ sub: 'auth0|ana2', name: 'Ana', email: 'ana2@example.com' });
    var httpServer = await start(0);
    puerto = httpServer.address().port;
  });

  afterEach(function () {
    sockets.forEach(function (socket) { socket.close(); });
    sockets = [];
  });

  afterAll(function () {
    return new Promise(function (resolve) {
      ioServer.close(resolve);
    });
  });

  it('entrega la pagina del chat', function () {
    return getRoot(puerto).then(function (respuesta) {
      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toContain('id="m"');
      expect(respuesta.body).toContain('auth-gate');
    });
  });

  it('rechaza conexión anónima sin token', async function () {
    var err = await expectConnectError(puerto, null);
    expect(String(err.message)).toMatch(/AUTH_/);
  });

  it('rechaza token inválido', async function () {
    var err = await expectConnectError(puerto, 'no-es-un-jwt');
    expect(String(err.message)).toMatch(/AUTH_/);
  });

  it('rechaza token vencido', async function () {
    var expired = await signAccessToken({ sub: 'auth0|old', name: 'Old' }, { expired: true });
    var err = await expectConnectError(puerto, expired);
    expect(String(err.message)).toMatch(/AUTH_/);
  });

  it('rechaza audience incorrecta', async function () {
    var badAud = await signAccessToken({ sub: 'auth0|x', name: 'X' }, { audience: 'https://otra-api' });
    var err = await expectConnectError(puerto, badAud);
    expect(String(err.message)).toMatch(/AUTH_/);
  });

  it('rechaza emisor incorrecto', async function () {
    var badIss = await signAccessToken({ sub: 'auth0|x', name: 'X' }, { issuer: 'https://evil.example/' });
    var err = await expectConnectError(puerto, badIss);
    expect(String(err.message)).toMatch(/AUTH_/);
  });

  it('acepta conexión con access token válido', async function () {
    var socket = await abrirCliente(puerto, tokenAna);
    sockets.push(socket);
    expect(socket.connected).toBe(true);
  });

  it('entrega un texto a otro cliente sin cambiarlo', function () {
    return Promise.all([abrirCliente(puerto, tokenAna), abrirCliente(puerto, tokenAna2)]).then(function (clientes) {
      var emisor = clientes[0];
      var receptor = clientes[1];
      sockets.push(emisor, receptor);
      var recibido = esperarMensaje(receptor);
      enviar(emisor, 'Hola, este es un mensaje');
      return recibido.then(function (crudo) {
        var salida = JSON.parse(crudo);
        expect(salida.nombre).toBe('Ana');
        expect(salida.mensaje).toBe('Hola, este es un mensaje');
        expect(salida.userId).toBe('auth0|ana');
      });
    });
  });

  it('impide suplantar identidad con un nombre enviado por el cliente', function () {
    return Promise.all([abrirCliente(puerto, tokenAna), abrirCliente(puerto, tokenAna2)]).then(function (clientes) {
      var emisor = clientes[0];
      var receptor = clientes[1];
      sockets.push(emisor, receptor);
      var recibido = esperarMensaje(receptor);
      enviar(emisor, 'intento de spoof', 'UsuarioFalsificado');
      return recibido.then(function (crudo) {
        var salida = JSON.parse(crudo);
        expect(salida.nombre).toBe('Ana');
        expect(salida.nombre).not.toBe('UsuarioFalsificado');
        expect(salida.userId).toBe('auth0|ana');
      });
    });
  });

  it('muestra una url de imagen como imagen', function () {
    return Promise.all([abrirCliente(puerto, tokenAna), abrirCliente(puerto, tokenAna2)]).then(function (clientes) {
      var emisor = clientes[0];
      var receptor = clientes[1];
      sockets.push(emisor, receptor);
      var recibido = esperarMensaje(receptor);
      enviar(emisor, 'http://image.com/image.jpg');
      return recibido.then(function (crudo) {
        var salida = JSON.parse(crudo);
        expect(salida.mensaje).toBe('<img src="http://image.com/image.jpg" style="max-height: 400px;max-width: 400px;">');
      });
    });
  });

  it('inserta el reproductor de un enlace compartido de youtube', function () {
    return Promise.all([abrirCliente(puerto, tokenAna), abrirCliente(puerto, tokenAna2)]).then(function (clientes) {
      var emisor = clientes[0];
      var receptor = clientes[1];
      sockets.push(emisor, receptor);
      var recibido = esperarMensaje(receptor);
      enviar(emisor, 'https://youtu.be/qYwlqx-JLok?si=AbCdEfGh12');
      return recibido.then(function (crudo) {
        var salida = JSON.parse(crudo);
        expect(salida.mensaje).toContain('https://www.youtube.com/embed/qYwlqx-JLok');
        expect(salida.mensaje).toContain('<iframe');
        expect(salida.mensaje).not.toContain('si=');
      });
    });
  });

  it('muestra una url gif como imagen', function () {
    return Promise.all([abrirCliente(puerto, tokenAna), abrirCliente(puerto, tokenAna2)]).then(function (clientes) {
      var emisor = clientes[0];
      var receptor = clientes[1];
      sockets.push(emisor, receptor);
      var recibido = esperarMensaje(receptor);
      enviar(emisor, 'http://image.com/image.gif');
      return recibido.then(function (crudo) {
        var salida = JSON.parse(crudo);
        expect(salida.mensaje).toBe('<img src="http://image.com/image.gif" style="max-height: 400px;max-width: 400px;">');
      });
    });
  });

  it('inserta el reproductor de un watch de youtube con parametros extra', function () {
    return Promise.all([abrirCliente(puerto, tokenAna), abrirCliente(puerto, tokenAna2)]).then(function (clientes) {
      var emisor = clientes[0];
      var receptor = clientes[1];
      sockets.push(emisor, receptor);
      var recibido = esperarMensaje(receptor);
      enviar(emisor, 'https://www.youtube.com/watch?v=qYwlqx-JLok&t=43s');
      return recibido.then(function (crudo) {
        var salida = JSON.parse(crudo);
        expect(salida.mensaje).toContain('https://www.youtube.com/embed/qYwlqx-JLok');
        expect(salida.mensaje).toContain('<iframe');
        expect(salida.mensaje).not.toContain('t=43s');
      });
    });
  });

  it('inserta el reproductor de un short de youtube', function () {
    return Promise.all([abrirCliente(puerto, tokenAna), abrirCliente(puerto, tokenAna2)]).then(function (clientes) {
      var emisor = clientes[0];
      var receptor = clientes[1];
      sockets.push(emisor, receptor);
      var recibido = esperarMensaje(receptor);
      enviar(emisor, 'https://www.youtube.com/shorts/qYwlqx-JLok');
      return recibido.then(function (crudo) {
        var salida = JSON.parse(crudo);
        expect(salida.mensaje).toContain('https://www.youtube.com/embed/qYwlqx-JLok');
        expect(salida.mensaje).not.toContain('/shorts/');
      });
    });
  });

  it('muestra un video de instagram como reproductor', function () {
    return Promise.all([abrirCliente(puerto, tokenAna), abrirCliente(puerto, tokenAna2)]).then(function (clientes) {
      var emisor = clientes[0];
      var receptor = clientes[1];
      sockets.push(emisor, receptor);
      var recibido = esperarMensaje(receptor);
      enviar(emisor, 'https://www.instagram.com/reel/Cxyz123/?igsh=abc');
      return recibido.then(function (crudo) {
        var salida = JSON.parse(crudo);
        expect(salida.mensaje).toContain('https://www.instagram.com/reel/Cxyz123/embed');
        expect(salida.mensaje).toContain('<iframe');
      });
    });
  });

  it('muestra un video de google drive como reproductor', function () {
    return Promise.all([abrirCliente(puerto, tokenAna), abrirCliente(puerto, tokenAna2)]).then(function (clientes) {
      var emisor = clientes[0];
      var receptor = clientes[1];
      sockets.push(emisor, receptor);
      var recibido = esperarMensaje(receptor);
      enviar(emisor, 'https://drive.google.com/file/d/1AbCdefGhijk/view?usp=sharing');
      return recibido.then(function (crudo) {
        var salida = JSON.parse(crudo);
        expect(salida.mensaje).toContain('https://drive.google.com/file/d/1AbCdefGhijk/preview');
        expect(salida.mensaje).toContain('<iframe');
      });
    });
  });

  it('no convierte en imagen una url que inyecta un script', function () {
    return Promise.all([abrirCliente(puerto, tokenAna), abrirCliente(puerto, tokenAna2)]).then(function (clientes) {
      var emisor = clientes[0];
      var receptor = clientes[1];
      sockets.push(emisor, receptor);
      var recibido = esperarMensaje(receptor);
      enviar(emisor, 'http://image.com/a.jpg"><script>alert(1)</script>');
      return recibido.then(function (crudo) {
        var salida = JSON.parse(crudo);
        expect(salida.mensaje).not.toContain('<img');
        expect(salida.mensaje).not.toContain('<script');
        expect(salida.mensaje).toContain('&lt;script&gt;');
      });
    });
  });

  it('escapa un script presente en el nombre del token verificado', async function () {
    var evilToken = await signAccessToken({
      sub: 'auth0|evil',
      name: 'Ana</b><script>alert(1)</script>'
    });
    return Promise.all([abrirCliente(puerto, evilToken), abrirCliente(puerto, tokenAna2)]).then(function (clientes) {
      var emisor = clientes[0];
      var receptor = clientes[1];
      sockets.push(emisor, receptor);
      var recibido = esperarMensaje(receptor);
      enviar(emisor, 'hola', 'Ignorado');
      return recibido.then(function (crudo) {
        var salida = JSON.parse(crudo);
        expect(salida.nombre).not.toContain('<script');
        expect(salida.nombre).toContain('&lt;script&gt;');
        expect(salida.mensaje).toBe('hola');
        expect(salida.userId).toBe('auth0|evil');
      });
    });
  });

  it('no reenvia un script ejecutable', function () {
    return Promise.all([abrirCliente(puerto, tokenAna), abrirCliente(puerto, tokenAna2)]).then(function (clientes) {
      var emisor = clientes[0];
      var receptor = clientes[1];
      sockets.push(emisor, receptor);
      var recibido = esperarMensaje(receptor);
      enviar(emisor, '<script>alert("xss")</script>');
      return recibido.then(function (crudo) {
        var salida = JSON.parse(crudo);
        expect(salida.mensaje).not.toContain('<script');
        expect(salida.mensaje).toContain('&lt;script&gt;');
      });
    });
  });

  it('GET /api/me exige Bearer token', function () {
    return new Promise(function (resolve, reject) {
      http.get({ hostname: '127.0.0.1', port: puerto, path: '/api/me' }, function (res) {
        expect(res.statusCode).toBe(401);
        resolve();
      }).on('error', reject);
    });
  });

  it('GET /api/me con token válido devuelve identidad', function () {
    return new Promise(function (resolve, reject) {
      http.get({
        hostname: '127.0.0.1',
        port: puerto,
        path: '/api/me',
        headers: { Authorization: 'Bearer ' + tokenAna }
      }, function (res) {
        var body = '';
        res.on('data', function (c) { body += c; });
        res.on('end', function () {
          expect(res.statusCode).toBe(200);
          var data = JSON.parse(body);
          expect(data.sub).toBe('auth0|ana');
          expect(data.name).toBe('Ana');
          resolve();
        });
      }).on('error', reject);
    });
  });
});
