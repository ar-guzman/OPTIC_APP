(function ($, Backbone, _, app) {

    // CSRF helper functions taken directly from Django docs
    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/i.test(method));
    }

    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = $.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(
                    cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Setup jQuery ajax calls to handle CSRF
    $.ajaxPrefilter(function (settings, originalOptions, xhr) {
        var csrftoken;
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            // Send the token to same-origin, relative URLs only.
            // Send the token only if the method warrants CSRF protection
            // Using the CSRFToken value acquired earlier
            csrftoken = getCookie('csrftoken');
            xhr.setRequestHeader('X-CSRFToken', csrftoken);
        }
    });

    app.opxhr = function(url, method, body, contentResponse) {
        return new Promise((solve, err) => {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    solve(xhttp.response, this.status, xhttp);
                }
            };
            xhttp.open(method, url, true);
            csrftoken = getCookie('csrftoken');
            xhttp.setRequestHeader('X-CSRFToken', csrftoken);
            xhttp.setRequestHeader(
              'Authorization',
              'Bearer ' + app.session.get('access_token')
            );
            if(contentResponse)
              xhttp.responseType = 'blob';
            xhttp.setRequestHeader('Content-Type', 'application/json');
            xhttp.send(body);

        }).catch(function (error) {
            console.error(error);
        });
    }

    var phone = RegExp('^[1-9][0-9]{7,7}$');

    var Session = Backbone.Model.extend({

        defaults: {
            access_token: null,
            refresh_token: null,
            exp: 0,
            name: '',
            is_admin: false,
            sucursal: null,
            photo: '/media/default.jpeg',
        },

        initialize: function (options) {

            this.options = options;
            this.load();
            $.ajaxPrefilter($.proxy(this._setupAuth, this));

        },
        load: function () {
          if(this.refresh_validity())
            this.refreshToken();
        },
        refresh_validity: function(){

          let rToken = localStorage.api_token;

          if(!rToken)
            return false;

          let tokenData = this.parseJwt(rToken);

          //damos una ventana de 30 segundos para refrescar el token
          if(tokenData.exp < (Math.floor(Date.now() / 1000)-30)) return false;

          this.set('refresh_token',rToken);
          return true;

        },
        check_validity: function(){

          if(this.get('access_token') != null && this.get('exp') != 0
              && this.get('exp') > (Math.floor(Date.now() / 1000)-30))
              return true;

          let rToken = localStorage.api_token;

          if(!rToken)
            return false;

          if(this.refresh_validity())
            this.refreshToken();


        },
        save: function (data) {

            this.set('access_token', data.access);

            if( data.hasOwnProperty('refresh') ){
              this.set('refresh_token', data.refresh);
              localStorage.api_token = data.refresh;
            }

            this.parseToken(data.access);

            setTimeout(this.refreshToken.bind(this),590000);
        },
        parseToken: function(token){

          let payload = this.parseJwt(token);

          for(let key in payload)
            if(key == 'photo')
              this.set(key,(payload[key] || this.defaults.photo));
            else
              this.set(key,payload[key]);

        },
        parseJwt: function(token) {

          var base64Url = token.split('.')[1];
          var base64 = base64Url.replace('-', '+').replace('_', '/');
          return JSON.parse(window.atob(base64));

        },
        delete: function () {

          this.clear({silent:true});
          this.set(this.defaults);

          localStorage.removeItem('api_token');

          window.location = '/';

        },
        authenticated: function () {
          return this.get('access_token') !== null;
        },
        _setupAuth: function (settings, originalOptions, xhr) {

            if (this.authenticated()) {
                xhr.setRequestHeader(
                  'Authorization',
                  'Bearer ' + this.get('access_token')
                );
            }
        },
        refreshToken: function(){

          let self = this,
              rToken = this.get('refresh_token');

          this.request = $.post(app.apiRefresh,{"refresh":rToken})
          .done(self.save.bind(self))
          .fail(self.delete.bind(self))

        }
    });

    app.session = new Session();

    var CustomCollectionProperties = {
      initialize:function(options){
          options || (options = {});
          _.extend(this,_.pick(options,['fetch','success']));
          options.url && (this.url = options.url);
          options.name && (this.name = options.name);
          this.data = new Map();
      },
      fetch: function(attributes = {}){

        if(!this.url) new Error('Error de tiempo de ejecución, confirmar ruta');

        let request = new Promise(
          (resolve,reject)=>{
            $.ajax({
              url: this.url,
              type: 'GET',
              data: _.extend(attributes,{'partial':'','page_size':'all'}),
            })
            .done((jsonResponse,textStatus,jqXHR) => resolve([jsonResponse,textStatus,jqXHR]))
            .fail((xhr, status, err) => reject([xhr, status, err]));
        });

        request.then(function(value){
            this.success.apply(this,value)
        }.bind(this))
        .catch(function(value){
            this.error.apply(this,value);
        }.bind(this));

        return request;
      },
      success: function(responseJSON,textStatus,jqXHR){

        this.data.clear();
        this.data.set(0,'Elegir '+this.name);
        responseJSON.results.forEach(function(el){
            let key = Object.keys(el)[0];
            this.data.set(Number(key),el[key])
        },this);
      },
      resetData: function(){
        this.data.clear();
        this.data.set(0,'Elegir '+this.name);
      },
      error: function(xhr, status, err){
        console.log('error ajax');
        console.log(xhr);
        console.log(status);
        console.log(err);
      },
      getOrFetch:function(id){

        let model = this.data.get(id);

        let result = new Promise(

          (resolve, reject) => {

          if (!model) {

            $.ajax({
                url: this.url + id,
                method: 'GET',
                data: 'partial',
                success: function (response, options) {
                    let key = Object.keys(response)[0];
                    this.data.set(key,response[key]);
                    resolve (this.data.get(key));
                  }.bind(this),
                error: function (response, options) {
                    reject(new Error('No encontrado en la BD'));
                }
            });
          }
          else
            resolve(model);
        });
        /*  Retorna la promesa */
        return result;
      }
    };

    var CustomCollection = function(options){
      this.initialize(...[options]);
    }

    _.extend(CustomCollection.prototype,CustomCollectionProperties);

    var BaseCollection = Backbone.Collection.extend({
        parse: function (response) {
            this._next     = (response.next)?true:false;
            this._previous = (response.previous)?true:false;
            this._count    = response.count;
            this._current  = response.current;
            this._full     = (response.next == null && response.previous == null)?
                            true:false;
            return response.results || [];
        },
        getOrFetch: function (id) {

            let model = this.get(id);

            let result = new Promise(

              (resolve, reject) => {

              if (!model) {

                var self = this;
                model = this.push({id:id});
                model.fetch({
                    add: true,
                    reset: false,
                    update: true,
                    remove: false,
                    success: function (model, response, options) {
                        resolve(model);
                    },
                    error: function (model, response, options) {
                        //si falla eliminamos el modelo de la colleción
                        self.pop(model);
                        reject(new Error('No encontrado en la BD'));
                    }
                });
              }
              else
                resolve(model);
            });
            /*  Retorna la promesa */
            return result;
        }

    });

    var BaseModel = Backbone.Model.extend({
        sync: function(method, model, options) {

          app.session.check_validity()
          Backbone.sync.call(this, method, model, options );

        },
        url: function () {
            var links = this.get('uri'),
                url = links;

            if (!url) {
                url = Backbone.Model.prototype.url.call(this);
            }

            return url;
        },
        _validate: function(attrs, options) {
          if (!options.validate || !this.validate) return true;
          let tmpAttrs = _.extend({}, this.attributes, attrs);
          var error = this.validationError = this.validate(tmpAttrs, options) || null;
          if (!error){ this._change(attrs,tmpAttrs); return true;}
          this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
          return false;
        },
        _change(obj1,obj2){
          for(let key in obj1)
            if(obj2.hasOwnProperty(key) && obj2[key] != obj1[key])
              obj1[key] = obj2[key];
        }
    });

    app.models.Inventario = BaseModel.extend({
      constructor:function Inventario(){
        Inventario.__super__.constructor.apply(this,arguments);
      },
      validate: function(attrs){
        let errors = [];

        if(!attrs.disponibles)
          errors.push({disponibles:"Debe especificar un número de aros disponibles"});
        else
          if(attrs.disponibles < 0)
            errors.push({disponibles:"El total de aros disponibles debe ser un entero positivo"});

        if(!attrs.costo)
          errors.push({costo:"El costo no puede quedar vacío"});
        else
          if(attrs.costo <= 0)
            errors.push({costo:"El costo no puede ser 0 o menor a este"});

        if(attrs.marca){
          delete attrs['marca'];
          delete this.attributes['marca'];
        }

        return errors.length > 0 ? errors : false;
      }

    });

    app.models.Optica = BaseModel.extend({
      constructor: function Optica(){
        Optica.__super__.constructor.apply(this,arguments);
      },
      validate: function(attrs){
        let errors = [];

        //agregar expresión regular

        if (!attrs.name)
          errors.push({name: 'name',
                  message: 'Obligatorio, se aceptan letras|números y espacios'
          });

        if(!attrs.direction)
          errors.push({name: 'direction',
                  message: 'Obligatorio, se aceptan letras|números|,|.|-|_|#'
          });

        if (!attrs.contact_1 || !phone.test(attrs.contact_1))
          errors.push({name: 'contact_1',
                  message: 'Obligatorio, ingrese 8 dígitos sin espacios'});

        if (attrs.contact_2 && !phone.test(attrs.contact_2))
            errors.push({name:'contact_2',
                        message: 'Número inválido, ingrese 8 dígitos sin espacios'});

        else if(!attrs.contact_2)
            attrs['contact_2'] = null;

        return errors.length > 0 ? errors : false;
      },
    });

    app.models.Proveedor = BaseModel.extend({
      constructor: function Proveedor() {
          Proveedor.__super__.constructor.apply(this, arguments);
      },
      validate: function(attrs){

          let errors = [];

          if (!attrs.name)
              errors.push({name: 'name',
                      message: 'Obligatorio, se aceptan letras|números|,|.|-|_|#'
              });

          if (!attrs.contact_1 || !phone.test(attrs.contact_1))
              errors.push({name: 'contact_1',
                      message: 'Obligatorio, ingrese 8 dígitos sin espacios'});

          if (attrs.contact_2 && !phone.test(attrs.contact_2))
              errors.push({name:'contact_2',
                          message: 'Número inválido, ingrese 8 dígitos sin espacios'});
          else if(!attrs.contact_2)
              attrs['contact_2'] = null;

          return errors.length > 0 ? errors : false;
      }
    });

    app.models.Marca  = BaseModel.extend({
      constructor: function Marca() {
          Marca.__super__.constructor.apply(
              this, arguments
          );
      },
      validate: function(attrs){

        let errors = [];

        if(!attrs.name)
          errors.push({name:'name',
            message: 'Obligatorio, se aceptan letras|números|-|_|#'
          })

        return errors.length > 0 ? errors : false;
      }
    });

    app.models.Aro     = BaseModel.extend({
      constructor: function Aro() {
        Aro.__super__.constructor.apply(
          this, arguments
        );
      },
      validate: function(attrs){

        let errors = [];

        let modelo = RegExp('^[0-9A-Za-z\-_\#]+$');

        if (!attrs.modelo)
          errors.push({name: 'modelo',
              message: 'Obligatorio, se aceptan letras|números|-|_|#'
          });
        else if (!modelo.test(attrs.modelo))
          errors.push({name: 'modelo',
            message: 'Patrón incorrecto, SÓLO se aceptan letras|números|-|_|#'
          });

        if (!attrs.color)
          errors.push({name: 'color',
                  message: 'Obligatorio, se aceptan letras|números|-|_|#'});
        else if (!modelo.test(attrs.color))
          errors.push({name: 'color',
              message: 'Patrón incorrecto, SÓLO se aceptan letras|números|-|_|#'
            });

        return errors.length > 0 ? errors : false;
      }
    });

    app.models.Laboratorio = app.models.Proveedor.extend({
      constructor: function Laboratorio() {
        Laboratorio.__super__.constructor.apply(this, arguments);
      },
    });

    app.models.Lente = BaseModel.extend({
      constructor:function Lente(){
        Lente.__super__.constructor.apply(this,arguments);
      }
    });

    app.models.Filtro = BaseModel.extend({
      constructor: function Filtro(){
        Filtro.__super__.constructor.apply(this,arguments);
      }
    });

    app.models.Empleado = BaseModel.extend({
      constructor: function Empleado(){
        Empleado.__super__.constructor.apply(this,arguments);
      },
      validate(attrs){

        let errors = [];

        if(!attrs.dpi){
          attrs['dpi'] = null;
        }

        if(!attrs.contact){
          attrs['contact'] = null;
        }else{
          if(!/^[1-9][0-9]{7,7}$/.test(attrs.contact))
          errors.push({name:'contact',
          message:'El número de teléfono debe tener 8 dígitos'
          })
        }

        return errors.length > 0 ? errors : false;

      }
    });

    app.models.Cliente = BaseModel.extend({
      validate: function(attrs){

          let errors = [];

          if (!attrs.firstname)
              errors.push({firstname: 'firstname',
                      message: 'Este campo es obligatorio, se aceptan letras solamente.'
              });

          if (!attrs.lastname)
              errors.push({lastname: 'lastname',
                      message: 'Este campo es obligatorio, se aceptan letras solamente.'
              });

          if (!attrs.contact_1 || !phone.test(attrs.contact_1))
              errors.push({name: 'contact_1',
                      message: 'Obligatorio, ingrese 8 dígitos sin espacios'});

          if (attrs.contact_2 && !phone.test(attrs.contact_2))
              errors.push({name:'contact_2',
                          message: 'Número inválido, ingrese 8 dígitos sin espacios'});
          else if(!attrs.contact_2)
              attrs['contact_2'] = null;

          return errors.length > 0 ? errors : false;
      },
    });

    app.models.OrdenCompleta = BaseModel.extend({
      constructor: function OrdenCompleta() {
          OrdenCompleta.__super__.constructor.apply(this, arguments);
      },
      type: 'C',
    });


    app.collections.ready = $.getJSON(app.apiRoot);

    app.collections.ready.done(

        function (data) {

          /*  colecciones custom de datos */
          app.fixedData.proveedores = new CustomCollection({
            url:  data.proveedor,
            name: 'proveedor'
          });

          app.fixedData.marcas = new CustomCollection({
            url:  data.marca,
            name: 'marca'
          });

          app.fixedData.opticas = new CustomCollection({
            url: data.optica,
            name: 'optica',
          });

          app.fixedData.aros = new CustomCollection({
            url: data.aro,
            name: 'aro',
          });

          app.fixedData.filtros = new CustomCollection({
            url: data.filtro,
            name: 'filtro',
          });

          app.fixedData.inventario_marcas = new CustomCollection({
            url: data.inventario,
            name: 'marcas en inventario',
          });

          app.fixedData.inventario_aros = new CustomCollection({
            url: data.inventario,
            name: 'aros en inventario',
          });

          app.fixedData.lentes = new CustomCollection({
            url: data.lente,
            name: 'lentes',
          });

          /*  colecciones de backbone */
          app.collections.Proveedor = BaseCollection.extend({
              model: app.models.Proveedor,
              url: data.proveedor,
              constructor: function Proveedores() {
                  Proveedores.__super__.constructor.apply(
                      this, arguments
                  );
              },
          });

          app.collections.Laboratorio = BaseCollection.extend({
              model: app.models.Laboratorio,
              url: data.laboratorio,
              constructor: function Laboratorios() {
                  Laboratorios.__super__.constructor.apply(this, arguments);
              },
          });

          app.collections.Marca = BaseCollection.extend({
            model:app.models.Marca,
            url: data.marca,
            constructor: function Marcas() {
              Marcas.__super__.constructor.apply(this, arguments);
            },
          });

          app.collections.Aros = BaseCollection.extend({
            model:  app.models.Aro,
            url:    data.aro,
            constructor: function Aros(){
              Aros.__super__.constructor.apply(this,arguments);
            },
          });

          app.collections.Optica = BaseCollection.extend({
            model:  app.models.Optica,
            url:    data.optica,
            constructor: function Optica(){
              Optica.__super__.constructor.apply(this,arguments);
            },
          });

          app.collections.Inventario = BaseCollection.extend({
            model: app.models.Inventario,
            url:   data.inventario,
            constructor: function Inventario(){
              Inventario.__super__.constructor.apply(this,arguments);
            }
          });

          app.collections.Lente = BaseCollection.extend({
            model: app.models.Lente,
            url:   data.lente,
            constructor: function Lente(){
              Lente.__super__.constructor.apply(this,arguments);
            }
          });

          app.collections.Filtro = BaseCollection.extend({
            model:app.models.Filtro,
            url:  data.filtro,
            constructor: function Filtro(){
              Filtro.__super__.constructor.apply(this,arguments);
            }
          });

          app.collections.Empleado = BaseCollection.extend({
            model:app.models.Empleado,
            url: data.empleado,
            constructor: function Empleado(){
              Empleado.__super__.constructor.apply(this,arguments);
            }
          });

          app.models.Cliente = app.models.Cliente.extend({
            urlRoot:data.cliente,
            constructor: function Cliente() {
                Cliente.__super__.constructor.apply(this, arguments);
            },
          });

          app.collections.Cliente = BaseCollection.extend({
              model: app.models.Cliente,
              url: data.cliente,
              constructor: function Clientes() {
                  Clientes.__super__.constructor.apply(this, arguments);
              },
          });

          app.collections.OrdenCompleta = BaseCollection.extend({
              model: app.models.OrdenCompleta,
              url: data.ordencompleta,
              constructor: function OrdenesCompletas() {
                  OrdenesCompletas.__super__.constructor.apply(this, arguments);
              },
          });

          app.urls = {};
          app.urls.ordenaro = data.ordenaro;
          app.urls.ordencompleta = data.ordencompleta;

        app.proveedor   = new app.collections.Proveedor();
        app.marca       = new app.collections.Marca();
        app.aro         = new app.collections.Aros();
        app.optica      = new app.collections.Optica();
        app.inventario  = new app.collections.Inventario();
        app.laboratorio = new app.collections.Laboratorio();
        app.lente       = new app.collections.Lente();
        app.filtro      = new app.collections.Filtro();
        app.empleado    = new app.collections.Empleado();
        app.cliente     = new app.collections.Cliente();
        app.ordencompleta = new app.collections.OrdenCompleta();
    });

})(jQuery, Backbone, _, app);
