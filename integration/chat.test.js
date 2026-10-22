var http = require('http');
var { start, io: ioServer } = require('../server');
var { io: ioClient } = require('socket.io-client');

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

function abrirCliente(port) {
  return new Promise(function (resolve, reject) {
    var socket = ioClient('http://127.0.0.1:' + port, {
      transports: ['websocket'],
      forceNew: true
    });
    socket.once('connect', function () { resolve(socket); });
    socket.once('connect_error', reject);
  });
}

function esperarMensaje(socket) {
  return new Promise(function (resolve) {
    socket.once('Evento-Mensaje-Server', resolve);
  });
}

function enviar(socket, mensaje, nombre) {
  socket.emit('Evento-Mensaje-Server', JSON.stringify({
    nombre: nombre || 'Ana',
    color: '#112233',
    mensaje: mensaje
  }));
}

describe('chat por socket', function () {
  var sockets = [];

  beforeAll(function () {
    return start(0).then(function (httpServer) {
      puerto = httpServer.address().port;
    });
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
      expect(respuesta.body).toContain('Evento-Mensaje-Server');
    });
  });

  it('entrega un texto a otro cliente sin cambiarlo', function () {
    return Promise.all([abrirCliente(puerto), abrirCliente(puerto)]).then(function (clientes) {
      var emisor = clientes[0];
      var receptor = clientes[1];
      sockets.push(emisor, receptor);
      var recibido = esperarMensaje(receptor);
      enviar(emisor, 'Hola, este es un mensaje');
      return recibido.then(function (crudo) {
        var salida = JSON.parse(crudo);
        expect(salida.nombre).toBe('Ana');
        expect(salida.mensaje).toBe('Hola, este es un mensaje');
      });
    });
  });

  it('muestra una url de imagen como imagen', function () {
    return Promise.all([abrirCliente(puerto), abrirCliente(puerto)]).then(function (clientes) {
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
    return Promise.all([abrirCliente(puerto), abrirCliente(puerto)]).then(function (clientes) {
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
    return Promise.all([abrirCliente(puerto), abrirCliente(puerto)]).then(function (clientes) {
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
    return Promise.all([abrirCliente(puerto), abrirCliente(puerto)]).then(function (clientes) {
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
    return Promise.all([abrirCliente(puerto), abrirCliente(puerto)]).then(function (clientes) {
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
    return Promise.all([abrirCliente(puerto), abrirCliente(puerto)]).then(function (clientes) {
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
    return Promise.all([abrirCliente(puerto), abrirCliente(puerto)]).then(function (clientes) {
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
    return Promise.all([abrirCliente(puerto), abrirCliente(puerto)]).then(function (clientes) {
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

  it('escapa un script enviado en el nombre', function () {
    return Promise.all([abrirCliente(puerto), abrirCliente(puerto)]).then(function (clientes) {
      var emisor = clientes[0];
      var receptor = clientes[1];
      sockets.push(emisor, receptor);
      var recibido = esperarMensaje(receptor);
      enviar(emisor, 'hola', 'Ana</b><script>alert(1)</script>');
      return recibido.then(function (crudo) {
        var salida = JSON.parse(crudo);
        expect(salida.nombre).not.toContain('<script');
        expect(salida.nombre).toContain('&lt;script&gt;');
        expect(salida.mensaje).toBe('hola');
      });
    });
  });

  it('no reenvia un script ejecutable', function () {
    return Promise.all([abrirCliente(puerto), abrirCliente(puerto)]).then(function (clientes) {
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
});
