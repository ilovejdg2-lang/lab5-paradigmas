var val = require('../libs/unalib');
var assert = require('assert');


describe('unalib', function(){


  describe('funcion is_valid_phone', function(){

    it('deberia devolver true para 8297-8547', function(){

      assert.equal(val.is_valid_phone('8297-8547'), true);

    });

    it('deberia devolver false para 8297p-8547', function(){

      assert.equal(val.is_valid_phone('8297p-8547'), false);

    });

  });


  describe('funcion is_valid_url_image', function(){

    it('deberia devolver true para http://image.com/image.jpg', function(){

      assert.equal(val.is_valid_url_image('http://image.com/image.jpg'), true);

    });

    it('deberia devolver true para http://image.com/image.gif', function(){

      assert.equal(val.is_valid_url_image('http://image.com/image.gif'), true);

    });
    
  });

  describe('funcion is_valid_yt_video', function(){

    it('deberia devolver true para http://image.com/image.jpg', function(){

      assert.equal(val.is_valid_yt_video('https://www.youtube.com/watch?v=qYwlqx-JLok'), true);

    });

    it('deberia devolver true para un enlace compartido con parametros', function(){

      assert.equal(val.is_valid_yt_video('https://youtu.be/qYwlqx-JLok?si=AbCdEfGh12'), true);
      assert.equal(val.is_valid_yt_video('https://www.youtube.com/watch?v=qYwlqx-JLok&t=43s'), true);
      assert.equal(val.is_valid_yt_video('https://www.youtube.com/shorts/qYwlqx-JLok'), true);

    });

    var otrasPlataformas = [
      { url: 'https://vimeo.com/76979871', src: 'https://player.vimeo.com/video/76979871' },
      { url: 'https://www.dailymotion.com/video/x7tgad0', src: 'https://www.dailymotion.com/embed/video/x7tgad0' },
      { url: 'https://www.tiktok.com/@user/video/1234567890123456789', src: 'https://www.tiktok.com/embed/v2/1234567890123456789' },
      { url: 'https://www.facebook.com/watch/?v=1234567890', src: 'https://www.facebook.com/plugins/video.php?href=' },
      { url: 'https://www.instagram.com/reel/Cxyz123/?igsh=abc', src: 'https://www.instagram.com/reel/Cxyz123/embed' },
      { url: 'https://drive.google.com/file/d/1AbCdefGhijk/view?usp=sharing', src: 'https://drive.google.com/file/d/1AbCdefGhijk/preview' }
    ];

    otrasPlataformas.forEach(function(caso) {

      it('deberia mostrar un reproductor para ' + caso.url, function() {

        assert.equal(val.is_valid_yt_video(caso.url), false);

        var salida = JSON.parse(val.validateMessage(JSON.stringify({
          nombre: 'Ana',
          color: '#112233',
          mensaje: caso.url
        })));

        assert.equal(salida.mensaje.indexOf('<iframe') !== -1, true);
        assert.equal(salida.mensaje.indexOf(caso.src) !== -1, true);
        assert.equal(salida.mensaje.indexOf('<script') === -1, true);

      });

    });

    it('deberia reproducir un archivo de video', function() {

      var url = 'https://cdn.example.com/clip.mp4';
      var salida = JSON.parse(val.validateMessage(JSON.stringify({
        nombre: 'Ana',
        color: '#112233',
        mensaje: url
      })));

      assert.equal(salida.mensaje.indexOf('<video') !== -1, true);
      assert.equal(salida.mensaje.indexOf(url) !== -1, true);

    });

    it('deberia extraer un video de youtube escondido en un enlace de google', function() {

      var url = 'https://www.google.com/url?q=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DqYwlqx-JLok';
      var salida = JSON.parse(val.validateMessage(JSON.stringify({
        nombre: 'Ana',
        color: '#112233',
        mensaje: url
      })));

      assert.equal(salida.mensaje.indexOf('https://www.youtube.com/embed/qYwlqx-JLok') !== -1, true);

    });

  });

  describe('validacion de inyeccion de scripts en el chat', function(){

    function salidaDe(mensaje) {
      return JSON.parse(val.validateMessage(JSON.stringify({
        nombre: 'Ana',
        color: '#112233',
        mensaje: mensaje
      })));
    }

    function assertCampoDeTexto(valor) {
      assert.equal(valor.indexOf('<') === -1, true);
      assert.equal(valor.indexOf('>') === -1, true);
      assert.equal(valor.indexOf('"') === -1, true);
      assert.equal(valor.indexOf("'") === -1, true);
    }

    var ataquesAlMensaje = [
      { angulo: 'una etiqueta script', valor: '<script>alert("xss")</script>' },
      { angulo: 'un script con otra capitalizacion', valor: '<ScRiPt>alert(1)</ScRiPt>' },
      { angulo: 'un img con onerror', valor: '<img src=x onerror=alert(1)>' },
      { angulo: 'un svg con onload', valor: '<svg/onload=alert(1)>' },
      { angulo: 'un enlace javascript', valor: '<a href="javascript:alert(1)">click</a>' },
      { angulo: 'javascript escrito con entidades html', valor: '<a href="&#106;avascript:alert(1)">click</a>' },
      { angulo: 'javascript partido por un tabulador', valor: '<a href="java\tscript:alert(1)">click</a>' },
      { angulo: 'una url de imagen que cierra el src', valor: 'http://image.com/a.jpg"><script>alert(1)</script>' },
      { angulo: 'una url de imagen con onerror', valor: 'http://image.com/a.jpg" onerror="alert(1)' },
      { angulo: 'un iframe con data url', valor: '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>' }
    ];

    ataquesAlMensaje.forEach(function(ataque) {

      it('deberia neutralizar ' + ataque.angulo + ' en el mensaje', function() {

        var salida = salidaDe(ataque.valor);

        assertCampoDeTexto(salida.mensaje);
        assert.equal(salida.nombre, 'Ana');
        assert.equal(salida.color, '#112233');

      });

    });

    it('deberia neutralizar un script en el nombre', function() {

      var salida = JSON.parse(val.validateMessage(JSON.stringify({
        nombre: 'Ana</b><script>alert("nombre")</script>',
        color: '#112233',
        mensaje: 'hola'
      })));

      assertCampoDeTexto(salida.nombre);
      assert.equal(salida.nombre.indexOf('&lt;script&gt;') !== -1, true);
      assert.equal(salida.mensaje, 'hola');

    });

    it('deberia rechazar un color que sale del atributo style', function() {

      var salida = JSON.parse(val.validateMessage(JSON.stringify({
        nombre: 'Ana',
        color: "#112233' onmouseover='alert(1)",
        mensaje: 'hola'
      })));

      assert.equal(salida.color, '#000000');
      assert.equal(salida.nombre, 'Ana');
      assert.equal(salida.mensaje, 'hola');

    });

    it('deberia rechazar un color con javascript', function() {

      var salida = JSON.parse(val.validateMessage(JSON.stringify({
        nombre: 'Ana',
        color: 'red;background:url(javascript:alert(1))',
        mensaje: 'hola'
      })));

      assert.equal(salida.color, '#000000');

    });

    it('deberia decodificar escapes unicode del json antes de neutralizar el script', function() {

      var crudo = '{"nombre":"Ana","color":"#112233","mensaje":"\\u003cscript\\u003ealert(1)\\u003c/script\\u003e"}';
      var salida = JSON.parse(val.validateMessage(crudo));

      assertCampoDeTexto(salida.mensaje);
      assert.equal(salida.mensaje.indexOf('&lt;script&gt;') !== -1, true);

    });

    it('deberia neutralizar un script cuando el mensaje no es json', function() {

      var salida = JSON.parse(val.validateMessage('<script>alert(1)</script>'));

      assertCampoDeTexto(salida.mensaje);
      assert.equal(salida.mensaje.indexOf('&lt;script&gt;') !== -1, true);

    });

    it('deberia conservar un mensaje de texto sin scripts', function() {

      var salida = salidaDe('Hola, este es un mensaje');

      assert.equal(salida.nombre, 'Ana');
      assert.equal(salida.color, '#112233');
      assert.equal(salida.mensaje, 'Hola, este es un mensaje');

    });

    it('deberia seguir mostrando una imagen legitima', function() {

      var salida = salidaDe('http://image.com/image.jpg');

      assert.equal(salida.mensaje, '<img src="http://image.com/image.jpg" style="max-height: 400px;max-width: 400px;">');

    });

    it('deberia seguir mostrando un video legitimo de youtube', function() {

      var salida = salidaDe('https://www.youtube.com/watch?v=qYwlqx-JLok');

      assert.equal(salida.mensaje.indexOf('https://www.youtube.com/embed/qYwlqx-JLok') !== -1, true);
      assert.equal(/<\s*script/i.test(salida.mensaje), false);
      assert.equal(/on\w+\s*=/i.test(salida.mensaje), false);

    });

    it('deberia insertar el reproductor de un enlace compartido de youtube', function() {

      var salida = salidaDe('https://youtu.be/qYwlqx-JLok?si=AbCdEfGh12');

      assert.equal(salida.mensaje.indexOf('https://www.youtube.com/embed/qYwlqx-JLok') !== -1, true);
      assert.equal(salida.mensaje.indexOf('<iframe') !== -1, true);
      assert.equal(salida.mensaje.indexOf('si=') === -1, true);

    });

  });

});







