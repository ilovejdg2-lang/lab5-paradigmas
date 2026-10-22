// modulo de ejemplo.

module.exports = {


    // logica que valida si un telefono esta correcto...
    is_valid_phone: function (phone) {
      // inicializacion lazy
      var isValid = false;
      // expresion regular copiada de StackOverflow
      var re = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/i;
  
      // validacion Regex
      try {
        isValid = re.test(phone);
      } catch (e) {
        console.log(e);
      } finally {
          return isValid;
      }
      // fin del try-catch block
    },
  
    is_valid_url_image: function (url) {
  
      // inicializacion lazy
      var isValid = false;
      // expresion regular copiada de StackOverflow
      var re = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|jpeg|bmp)/i;
  
      // validacion Regex
      try {
        isValid = re.test(url);
      } catch (e) {
        console.log(e);
      } finally {
          return isValid;
      }
      // fin del try-catch block
    },
  
    is_valid_yt_video: function (url) {
      return this.safeYtId(url) !== '';
    },
  
    getYTVideoId: function(url){
      return this.safeYtId(url);
    },
  
    getEmbeddedCode: function (url){
      var src = this.mediaEmbedSrc(url);
      if (!src) {
        return this.escapeHtml(url);
      }
      return this.playerTag(src);
    },

    playerTag: function (src) {
      return '<iframe width="560" height="400" src="' + src + '" title="Reproductor de video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
    },

    unwrapGoogleUrl: function (url) {
      var text = String(url || '').trim();
      var wrapped = text.match(/^https?:\/\/(?:www\.)?google\.com\/url\?(?:[^#]*&)?q=([^&]+)/i);
      if (!wrapped) {
        return text;
      }
      try {
        return decodeURIComponent(wrapped[1]);
      } catch (e) {
        return text;
      }
    },

    is_safe_video_file: function (url) {
      return /^https?:\/\/[^\s"'<>\\]+\.(?:mp4|webm|ogg)(?:\?[^\s"'<>\\]*)?$/i.test(url);
    },

    mediaEmbedSrc: function (url) {
      var text = this.unwrapGoogleUrl(url);
      if (typeof text !== 'string' || !/^https?:\/\/[^\s"'<>\\]+$/i.test(text)) {
        return '';
      }

      var yt = this.safeYtId(text);
      if (yt) {
        return 'https://www.youtube.com/embed/' + yt;
      }

      var ig = text.match(/^https?:\/\/(?:www\.)?instagram\.com\/(reels?|p|tv)\/([\w-]+)/i);
      if (ig) {
        var tipo = ig[1].toLowerCase() === 'reels' ? 'reel' : ig[1].toLowerCase();
        return 'https://www.instagram.com/' + tipo + '/' + ig[2] + '/embed';
      }

      if (/^https?:\/\/drive\.google\.com\//i.test(text)) {
        var archivo = text.match(/\/file\/d\/([\w-]+)/i);
        var abierto = text.match(/[?&]id=([\w-]+)/i);
        var driveId = archivo ? archivo[1] : (abierto ? abierto[1] : '');
        if (driveId) {
          return 'https://drive.google.com/file/d/' + driveId + '/preview';
        }
      }

      var vimeo = text.match(/^https?:\/\/(?:www\.)?(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)/i);
      if (vimeo) {
        return 'https://player.vimeo.com/video/' + vimeo[1];
      }

      var tiktok = text.match(/^https?:\/\/(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/i);
      if (tiktok) {
        return 'https://www.tiktok.com/embed/v2/' + tiktok[1];
      }

      var dailymotion = text.match(/^https?:\/\/(?:www\.)?dailymotion\.com\/video\/([a-z0-9]+)/i);
      if (dailymotion) {
        return 'https://www.dailymotion.com/embed/video/' + dailymotion[1];
      }

      var facebook = text.match(/^https?:\/\/(?:www\.)?facebook\.com\/watch\/?\?v=(\d+)/i);
      if (facebook) {
        var limpio = text.split('#')[0];
        return 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(limpio) + '&show_text=false&width=560';
      }

      return '';
    },
  
    getImageTag: function(url){
      var tag = '<img src="'+ this.escapeHtml(url) +'" style="max-height: 400px;max-width: 400px;">';
      return tag;
    },

    // La URL completa tiene que ser una imagen. Un texto que solo contiene
    // ".jpg" no debe convertirse en etiqueta ni romper el atributo src.
    is_safe_image_url: function (url) {
      var re = /^https?:\/\/[^\s"'<>\\]+\.(?:jpg|gif|png|jpeg|bmp)(?:\?[^\s"'<>\\]*)?(?:#[^\s"'<>\\]*)?$/i;
      return typeof url === 'string' && re.test(url);
    },

    // Detecta marcado que el cliente inserta con .html() y que puede ejecutar codigo.
    is_script_injection: function (text) {
      if (typeof text !== 'string') {
        return false;
      }
      var re = /<\s*\/?\s*script\b|j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:|&#\s*(0*106|x0*6a)\s*;|on\w+\s*=|<\s*\/?\s*(iframe|object|embed|svg|math|link|meta|base|form|img|video|source|body|details)\b/i;
      return re.test(text);
    },

    escapeHtml: function (text) {
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    safeYtId: function (url) {
      if (typeof url !== 'string') {
        return '';
      }
      var text = url.trim();
      if (!/^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\//i.test(text)) {
        return '';
      }
      var patterns = [
        /[?&]v=([\w-]{11})(?![A-Za-z0-9_-])/,
        /youtu\.be\/([\w-]{11})(?![A-Za-z0-9_-])/,
        /youtube\.com\/(?:embed|shorts|live|v)\/([\w-]{11})(?![A-Za-z0-9_-])/
      ];
      for (var i = 0; i < patterns.length; i++) {
        var match = text.match(patterns[i]);
        if (match) {
          return match[1];
        }
      }
      return '';
    },
  
    validateMessage: function(msg){
      // Handle invalid input
      if (!msg || typeof msg !== 'string') {
        return JSON.stringify({ mensaje: '' });
      }

      try {
        var obj = JSON.parse(msg);

        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
          return JSON.stringify({ mensaje: this.escapeHtml(msg) });
        }

        if (typeof obj.nombre === 'string') {
          obj.nombre = this.escapeHtml(obj.nombre);
        }

        if (typeof obj.color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(obj.color)) {
          obj.color = '#000000';
        }

        var texto = typeof obj.mensaje === 'string' ? this.unwrapGoogleUrl(obj.mensaje.trim()) : '';

        if (typeof obj.mensaje !== 'string') {
          obj.mensaje = '';
        }
        else if (this.is_safe_image_url(texto)) {
          console.log("Es una imagen!")
          obj.mensaje = this.getImageTag(texto);
        }
        else if (this.mediaEmbedSrc(texto)) {
          console.log("Es un video!")
          obj.mensaje = this.playerTag(this.mediaEmbedSrc(texto));
        }
        else if (this.is_safe_video_file(texto)) {
          console.log("Es un video!")
          obj.mensaje = '<video controls src="' + this.escapeHtml(texto) + '" style="max-width:100%;height:360px;"></video>';
        }
        else if (this.is_script_injection(obj.mensaje)) {
          console.log("Inyeccion de script bloqueada");
          obj.mensaje = this.escapeHtml(obj.mensaje);
        }
        else {
          console.log("Es un texto!")
          obj.mensaje = this.escapeHtml(obj.mensaje);
        }
      
        return JSON.stringify(obj);
      } catch (e) {
        console.log('Error processing message:', e);
        return JSON.stringify({ mensaje: this.escapeHtml(msg) });
      }
    }
  
  
  
    
    
  
  // fin del modulo
  };
  