/*
*     Modulos
*/
(function ($, Backbone, _, app) {

  function createElementWProperties(HTMLEl,properties){

    let element = document.createElement(HTMLEl);

    if(!(properties instanceof Object)) return element;

    for(let data in properties)
      if (properties.hasOwnProperty(data))
        element[data] = properties[data];

    return element;

  }

  function formSerialization( form ){

    let array = [];

    if ( !form ) return array;

    let custominputs = form.querySelectorAll('c-input'),
        inputs       = form.querySelectorAll('input'),
        selects      = form.querySelectorAll('select');

    custominputs.forEach(function(element){
      array.push(element);
    });

    inputs.forEach(function(element){
      array.push(element);
    });

    return array;
  }
  /**
  *   Función para determinar los cambios realizados a un modelo
  */
  function updateFields(model,foreignCollection){

      let data = {},
          message = [],
          extra;

      for (let i in model.attributes)
          if( model.attributes[i] != model._previousAttributes[i]){
              if(model.attributes[i] instanceof Array &&
                !_.isEqual(model.attributes[i],model._previousAttributes[i]))
                message.push(
                  `[${model._previousAttributes[i].map((item)=>{
                      return foreignCollection.data.get(item);
                    }).join(' , ')}] ha sido modificado por [${
                      model.attributes[i].map((item)=>{
                          return foreignCollection.data.get(item);
                    }).join(' , ')}]`
                )
              else
                message.push(`${(!model._previousAttributes[i])?
                              (extra = "----"):(""+model._previousAttributes[i])}
                              fue sustituido por
                              ${(!model.attributes[i])?(extra = "----\t"):
                                    (model.attributes[i])}\t`);
          }

      if(message.length){
          data.title    = "Cambios realizados!";
          data.message  = message;
          data.extra    = (!extra)?"":"*---- implica campo vacío";
      }else{
          data.title    = "Cambios no realizados!";
          data.message  = ["Ningún campo fue actualizado"];
          data.extra    = "";
      }

      return data;
  }

  /**
  * Función que crea un nuevo JSON a partir de dos JSON previos
  */
  function renderJSON(obj1){

      var data    = {};
      let button  = {
        'btn-del'  :`<button class="delete-button-table">
                            <i class="fa fa-trash"></i>
                        </button>`,
        'btn-edit' :`<button class="edit-button-table">
                            <i class="fas fa-pencil-alt"></i>
                        </button>`,
        'btn-save'    :`<button class='button-save-table'>
                            <i class='fa fa-check'></i>
                        </button>`,
        'btn-cancel'  :`<button class="button-cancel-table">
                            <i class="fa fa-times"></i>
                      </button>`
      };

      _.extend(data,obj1);
      _.extend(data,button);

      return data;
  }

    /*  Lista de vistas:
    *       TemplateView, FormView, ItemView son genéricos.
    *       El resto de elementos son particulares.
    */
    var TemplateView  = Backbone.View.extend({
        templateName: '',
        initialize: function () {
            this.template = _.template($(this.templateName).html());
        },
        render: function () {
            let context = this.getContext(),
                html = this.template(context);
            this.$el.html(html);
        },
        getContext: function () {
            return {};
        },
        destroy_view: function() {
            // UNBIND the view
            this.undelegateEvents();
            this.stopListening();
            this.$el.removeData();
            this.$el.off();

            // Remove view from DOM
            this.remove();
            Backbone.View.prototype.remove.call(this);
        },
        cleanView: function() {
            this.undelegateEvents();
            this.stopListening();
            this.$el.off();
            this.$el.empty();
            this.$el = $();
        }
    });

    var FormView      = TemplateView.extend({
        clearErrors: function () {
          this._cform.reset();
        },
        serializeForm: function ( form ) {

            if( $(form).is('c-form') )
              return form.serializeForm();

            return _.object(_.map(formSerialization(form),(item)=>[item.name, item.value]));
        },
        submit: function (event) {

            event.preventDefault();

            if(!this._cform.validate()) return;

            let data = this._cform.serializeForm();

            this._collection.create(data,
                {wait:true, validate:true,
                success: this.success.bind(this),
                error: this.error.bind(this),
              });
        },
        showErrors(errors){

            _.each(errors, function (error, index) {

              if(error.name == 'non_field_errors'){
                  this._cform.querySelector('c-input').setAttribute('ttip-position','bottom');
                  this._cform.querySelector('c-input').setAttribute('ttip',error.message);
                  return;
              }

              let inputs =
                this._cform.querySelectorAll('c-input[name='+error.name+']');

              inputs.forEach(function(element){
                element.setToolTip(error.message);
              })

          }, this);

        },
        error: function (model, xhr, options) {

            let errors = [];
            _.each(xhr.responseJSON,function(error,index){
                errors.push({
                  name:index,
                  message:error.join()
                })
            });

            this.showErrors(errors);
        },
        done: function (event) {
            if (event) event.preventDefault();
            this.trigger('done');
            this.destroy_view();
        }
    });

    var ModalView     = TemplateView.extend({
        tagName: 'div',
        className: 'modal',
        attributes: {
            'tabindex':1,
            'style':'display:none'
        },
        initialize: function(){
            this.listenTo(app.eventBus,'confirm',this.renderPromptMode);
            this.listenTo(app.eventBus,'message',this.renderMessageMode);
            this.templatePrompt = _.template($('#modal-prompt-template').html());
            this.templateMessage = _.template($('#modal-message-template').html());
            $('body').append(this.$el);
        },
        renderMessageMode: function(options){
            let html = this.templateMessage(options);
            this.$el.html(html);
            this.$el.show();
        },
        renderPromptMode: function(options){
            this.$el.html(this.templatePrompt({title:options.title}));
            this.action = options.action;
            this.$el.show();
        },
        events: {
            'click button.yes-button': 'sendYes',
            'click button.no-button': 'close',
            'click button.close': 'close'
        },
        sendYes: function(){
            if(this.action){
                app.eventBus.trigger('confirm:'+this.action);
                delete this.action;
            }
            this.close();
        },
        close: function(){
            this.$el.empty();
            this.$el.hide();
        }
    });

    var ItemView = FormView.extend({
        tagName : 'tr',
        events: {
            'click button.delete-button-table': 'deleted',
            'click button.button-cancel-table': 'cancel',
            'click button.edit-button-table':   'edit',
            'click button.button-save-table':   'save'
        },
        clearErrors: function(){
          let fields = this.el.querySelectorAll('span');
          fields && fields.forEach(function(element,index){
            if(element.hasAttribute('ttip'))
              element.removeAttribute('ttip');
          })
        },
        initialize: function (options){
            this.data           = renderJSON(this.model.attributes);
            this.renderCallback = 'renderViewMode';
            this._foreignCollection = options.foreignCollection;
            this.listenTo(this.model,"invalid",
                            function(model,error,options) {
                                this.showErrors(error);
                            }.bind(this)
                        );

            this.listenTo(
                    app.eventBus,
                    'confirm:action' + this.model.cid,
                    this.destroyModel
                    );

            this._fields = options.fields;
        },
        constructor: function ItemView() {
            ItemView.__super__.constructor.apply(
                this, arguments
            );
        },
        deleted: function(){
            /* disparar evento para mostrar dialogbox yes/no */
            app.eventBus.trigger('confirm',{'action':'action'+
                this.model.cid,
                'title':`Está seguro que desea eliminar a ${
                  (this._fields)?this._fields.map(
                    (item)=>{
                      return this.model.get(item);
                    },this).
                    join(' '):this.model.get('name')
                }`
              });
        },
        edit: function(){
            this.renderCallback = 'renderEditMode';
            this.$el.empty();
            this.render();
        },
        cancel: function(){
            app.eventBus.trigger('iView:clearErrors',{opt:false});
            this.renderCallback = 'renderViewMode';
            this.$el.empty();
            this.render();
        },
        destroyModel: function(){
            this.model.destroy({
                wait: true,
                error : this.error.bind(this),
                success : function(){
                            this.stopListening();
                            this.destroy_view();
                            app.eventBus.trigger('message',
                                            {title:'Información borrada...',
                                            message:[`Se ha eliminado a ${
                                              (this._fields)?this._fields.map(
                                                (item)=>{
                                                  return this.model.get(item);
                                                },this).
                                                join(' '):this.model.get('name')
                                            } con éxito`],
                                            extra:""}
                                            );
                        }.bind(this)
            });
        },
        save: function(event){
            this.clearErrors();
            let attributes = {};
            /*  Debemos serializar todos los inputs */
            attributes = _.object(_.map(
                  $(event.currentTarget.parentNode.parentNode).find('input'),
                  function (item) {
                      return [item.name,item.value];
                    }
                  ));

            this.model.save(attributes, {
                wait:     true,
                success:  this.success.bind(this),
                error :   this.error.bind(this)
            });
        },
        success: function(model,response){
            this.model.attributes = response;
            app.eventBus.trigger('message',updateFields(this.model,this._foreignCollection));
            this.data = renderJSON(response);
            this.cancel();
        },
        render: function(){
            this[this.renderCallback]();
            return this;
        },
        showErrors: function(errors){

          _.each(errors, function (element, index) {

              let field = this.el.querySelector('input[name='+element.name +']');

              if (field){
                let span = $(field).siblings()[0];

                $(span).attr({'ttip':element.message,
                  'ttip-position':'top'});
              }

          }, this);

          app.eventBus.trigger('iView:error',{opt:true});

        },
        renderViewMode: function(){

          let mappingCollections = function(fcData,val){
            let pCol = fcData[0];
            let fCol = fcData[1];

            if(!pCol.data.get(val)) return "<td>-</td>";

            let tmp = pCol.data.get(val);

            return `<td>${tmp[0]} (${(fCol.data.get(tmp[1]))?fCol.data.get(tmp[1]):"-- ninguno --"})</td>`

          }

          $(this.el).html(_.map(this.data,
            function(val, key){

                if(key == "id" || key == "uri" || key == "btn-save"
                    || key == "btn-cancel")
                    return;

                /* Antes de renderizar verificamos si tiene una dependencia,
                   de ser ese el caso entonces vemos si son varias o sólo una
                */
                if(this._foreignCollection)

                  if(this._foreignCollection instanceof Array &&
                      this._foreignCollection[0].name == key)
                    return mappingCollections(this._foreignCollection,val);
                  else if(this._foreignCollection.name == key)
                    return `<td>${(this._foreignCollection.data.get(val))?
                          this._foreignCollection.data.get(val):"-"}</td>`;


                return `<td>${(!val)?"-":val}</td>`

              },
              this
          ));

          return this;
        },
        renderEditMode: function(){

          let mappingCollections = function(fcData,val,key){
            let pCol = fcData[0];
            let fCol = fcData[1];

            if(!pCol.data.get(val)) return "<td>-</td>";

            let tmp = pCol.data.get(val);

            return `<td><span>${tmp[0]} (${(fCol.data.get(tmp[1]))?
                      fCol.data.get(tmp[1]):
                      "-- ninguno --"})</span>
                      <input name="${key}" value="${val}" read-only style="display:none"/>
                      </td>`
          }

          $(this.el).html(
            _.map(
                this.data,
                function(val, key){

                  if(key == "id" || key == "uri" || key == 'btn-edit'
                      || key == 'btn-del') return;

                  if(key == "btn-save" || key == "btn-cancel")
                    return `<td>${val}</td>`;

                  if(this._foreignCollection)
                    if(this._foreignCollection instanceof Array &&
                        this._foreignCollection[0].name == key)
                      return mappingCollections(this._foreignCollection,val,key);
                    else if(this._foreignCollection.name == key)
                      return `<td><span>${(this._foreignCollection.data.get(val))?
                          this._foreignCollection.data.get(val):"-"}</span>
                          <input name="${key}" value="${val}" read-only style="display:none"/>
                          </td>`;

                  return  `<td>
                          <span></span>
                          <input name="${key}"
                            value ="${((val==null)?"":val)}">
                           </td>`;

                 }, this
              )
            ); //fin del map a html

        },//fin método renderEditMode
    });

    var TableView     = TemplateView.extend({
        className:'selected',
        initialize : function(options){
            /* General atributos, sin problema*/
            this._collection  = options.collection;
            this._percentages = options.percentages || [];
            this._header      = options.header || [];
            this._subviews    = [];
            this._fields      = options.fields || null;
            this._collection.fetch();
            if(options._populateTable) this._populateTable = options._populateTable;
            this.el.setAttr(this._percentages, this._header);

            this.el.collection = this._collection;

            function tmp(opt){
              !opt || this.el.getTBody().setAttribute('style','overflow:hidden;');
              !opt && this.el.getTBody().removeAttribute('style');
            }

            this.listenTo(app.eventBus,'iView:error',tmp);
            this.listenTo(app.eventBus,'iView:clearErrors',tmp);
            this.el._cform.collection = this._collection;
            this._foreignCollection = options.foreignCollection || null;
            this._iView = options.itemView;

            /* Area de promises */
            if(this._foreignCollection){
              if(this._foreignCollection instanceof Array)
                this._foreignCollectionRequest = Promise.all(
                  this._foreignCollection.map(function(item){
                      return item.fetch();
                  })
                );
              else
                this._foreignCollectionRequest = this._foreignCollection.fetch();

              /* El foreginCollectionRequest es una promise */
              this._foreignCollectionRequest.then(function(){
                this._addFilter(this._foreignCollection);
              }.bind(this))
            }

            /*  Listen para hacer el update */
            this.listenTo(this._collection,'update',function(){
              this.el.createFooter();
              this.el.renderFooter();

              if(this._foreignCollection){
                this._foreignCollectionRequest.then(
                  function(){
                    this._reRenderTable();
                  }.bind(this)
                );
                return;
              }
              else
                this._reRenderTable();
            }.bind(this));
        },
        constructor: function TableView() {
            TableView.__super__.constructor.apply(
                this, arguments
            );
        },
        _createElement: function(){
            return new app.customElements.CTable();
        },
        _reRenderTable: function(){

          this._subviews.forEach(function(element){
            element.destroy_view();
          });

          this._subviews.length = 0;
          /*  eliminamos posibles elementos que aún están en el cuerpo  */
          while (this.el.getTBody().hasChildNodes())
            this.el.getTBody().removeChild(this.el.getTBody().lastChild);

          this._renderTable();
        },
        _renderTable: function(){
            this._populateTable();
            this._renderSubViews();
        },
        _populateTable: function(){

            _(this._collection.models).each(function( model ){
                  var iView;

                  if(this._iView)
                    iView = new this._iView({
                      model: model, foreignCollection: this._foreignCollection,
                      fields: this._fields,
                    });
                  else
                    iView = new ItemView({
                      model : model, foreignCollection : this._foreignCollection,
                      fields: this._fields,
                    });

                  this._subviews.push(iView);

              },this);
        },
        _renderSubViews: function(){

          _(this._subviews).each(function( view ){
              view.render();
              this.el.getTBody().append(view.el);
            },this);

          if(!this._subviews.length)
            this.el.renderEmptyTable();

          this.el.renderFooter(this);

        },
        _addFilter: function(opt){

          if(!(opt instanceof Object || opt instanceof Array)) return;

          let str = (opt instanceof Array)?opt[0].name:opt.name;

          let cselect = createElementWProperties('c-select',{'name':str,
                        'title':`${str
                        .split('.')
                        .map(w => w[0].toUpperCase() + w.substr(1).toLowerCase())
                        .join('.')
                        }:`});

          if(opt instanceof Array)
            cselect.multipleOptions = [opt[0].data,opt[1].data];
          else
            cselect.options = opt.data;

          let fncallback = ()=>{
            this.el.fetchCollection(1);
          }

          cselect.eventCallback = [];
          cselect.eventCallback.push(fncallback);
          cselect._csel.addEventListener('change',fncallback);
          this.el.getFilters().appendChild(cselect);
          this.el.createFilterControl();
        },
        destroy_view: function(){
          this.el.classList.remove('selected');
          this.el.classList.add('slide-transition');
          setTimeout(()=>{
            TemplateView.prototype.destroy_view.apply(this,arguments);
          },500);
        },
    });

    var GenericNewView = FormView.extend({
        events: {
          'submit c-form':'submit',
          'click button[type="reset"]':'reset'
        },
        className: 'cform-container',
        initialize: function(options){
          let template      = document.querySelector(this.templateName);
          this.el.appendChild(template.content.cloneNode(true));
          this._collection  = options.collection;
          this._wrapper     = options.wrapper_el;

          this.listenTo(this._collection,'saved',function(model){
            app.eventBus.trigger('message',
                            {title:model.constructor.name+': recién agregado.',
                            message:[(`Se ha agregado a:
                              ${(options.fields)?options.fields.map(
                              function(item){
                                return model.get(item);
                              }).join(' '):
                              model.get('name')}`)],
                            extra:""}
                            );
          });
          if(options.submit && _.isFunction(options.submit))
            _.extend(this,{'submit':options.submit});
        },
        success: function (model) {
            this._cform.reset();
            this._collection.trigger('saved');
        },
        render: function(){
          this._wrapper.appendChild(this.el);
          this._cform = this.el.querySelector('c-form');
          return this.el;
        },
        reset: function(){
          this._cform.reset();
        },
        destroy: function(){
            FormView.prototype.done.apply(this,arguments);
        }
    });

    var GenericTemplateView = TemplateView.extend({
      initialize: function(options){

          this.subViews = [];

          this.subViews.push(new TableView({
            collection:options.collection,
            header:options.header,
            percentages:options.percentages,
            foreignCollection: options.foreignCollection,
            itemView: options.itemView,
            fields: options.fields || null,
          }));

          this.subViews[0].el._cform.submit = function(event){
              event.preventDefault();
              let data = this.serializeForm(true);
              this._collection.fetch({
                data: data
              });
          }
      },
      render: function(){

          _(this.subViews).each(function( view ){
              this.el.appendChild(view.el);
          },this);

      },
      destroy: function(){

          _(this.subViews).each(function (view) {
              view.destroy_view();
          }, this);

          //TemplateView.prototype.cleanView.apply(this,arguments);
      }
    })

    /*  NEW (COLLECTION) VIEWS */
    var NewProveedorView = GenericNewView.extend({
      templateName: "#newproveedor-template",
      constructor: function NewProveedorView() {
          NewProveedorView.__super__.constructor.apply(this, arguments);
      },
    })

    var NewLaboratorioView = GenericNewView.extend({
      templateName: "#newlaboratorio-template",
      constructor: function NewLaboratorioView() {
          NewLaboratorioView.__super__.constructor.apply(this, arguments);
      },
    })

    var NewMarcaView = GenericNewView.extend({
      templateName: "#newmarca-template",
      constructor: function NewMarcaView() {
          NewMarcaView.__super__.constructor.apply(
              this, arguments
          );
      },
      initialize: function(options){
        GenericNewView.prototype.initialize.apply(this,[options]);
        this._csel = this.el.querySelector('c-select');
      },
      render: function(){
        let el = GenericNewView.prototype.render.apply(this,arguments);
      },
      setOptions: function(){

        app.fixedData.proveedores.fetch().then(function(){
            this._csel.options = app.fixedData.proveedores.data;
        }.bind(this));

      },
    });

    var NewAroView = GenericNewView.extend({
      templateName: '#newaro-template',
      constructor: function NewAroView() {
          NewAroView.__super__.constructor.apply(
              this, arguments
          );
      },
      render: function(){
        GenericNewView.prototype.render.apply(this,arguments);
        this._csel = this.el.querySelector('c-select');
      },
      setOptions: function(){
        Promise.all([app.fixedData.proveedores.fetch(),app.fixedData.marcas.fetch()])
        .then(
          function(){
            this._csel.multipleOptions =
                [app.fixedData.marcas.data,app.fixedData.proveedores.data];
        }.bind(this));
      },
    });

    var NewOpticaView = GenericNewView.extend({
      templateName: "#optica-template",
      constructor: function NewOpticaView() {
          NewOpticaView.__super__.constructor.apply(this, arguments);
      },
      render: function(){
        GenericNewView.prototype.render.apply(this,null);
        this.el.setAttribute('style',"overflow:auto; height:100%;");
      },
      submit: function(event){

        event.preventDefault();

        if(!this._cform.validate()) return;

        let data = this._cform.serializeForm(),
            form_data = new FormData(),
            self = this;

        for ( let key in data )
          form_data.append(key, data[key]);

        $.ajax({
          url: this._collection.url,
          data: form_data,
          cache: false,
          contentType: false,
          processData: false,
          type: 'POST',
          success: function(data){
            optica = data.name
            self._cform.reset();
            app.eventBus.trigger('message',
            {title:'Se ha agregado una nueva sucursal...',
            message:[`Se ha agregado la sucursal: ${optica}
            `],
            extra:""}
            );
          }
        });
      }
    });

    var NewInventarioDetailView = GenericNewView.extend({
      templateName: "#new-inv-detail-template",
      constructor: function NewInventarioDetailView(){
        NewInventarioDetailView.__super__.constructor.apply(this,arguments);
      },
      initialize: function(options){
        let template      = document.querySelector(this.templateName);
        this.el.appendChild(template.content.cloneNode(true));
        this._collection  = options.collection;
        this._wrapper     = options.wrapper_el;

        this.listenTo(this._collection,'add',function(model){
          app.eventBus.trigger('message',
                          {title:model.constructor.name + ': recién agregado.',
                          message:[('Se ha agregado una nueva entrada al inventario de fecha: '
                                    + model.get('fecha') +
                                    ' cantidad:' + model.get('disponibles')
                                  )],
                          extra:""}
                          );
        });

        let cselectors = this.el.querySelectorAll('c-select');

        Object.defineProperty(cselectors[2],'options',{

            set: function(opt) {

              if(!(opt instanceof Map)) return;

              this.clear();

              let createOpt = function(val,key){
                let d = document.createElement('option');
                d.value = key;
                d.textContent = (val instanceof Array)?
                                  `${val[0]} - ${val[1]}`:val;
                this._csel.appendChild(d);
              }

              opt.forEach(function(val,key){
                createOpt.apply(this,[val,key]);
              },this);
            }//fin de setter

        });

      },
      destroy: function(){
        this.el.querySelector('c-select[name="marca"]')
                  .removeEventListener('change',this._aroChange);
        GenericNewView.prototype.destroy.apply(this,arguments);
      },
      submit: function (event) {
          event.preventDefault();

          if(!this._cform.validate()) return;

          let data = this._cform.serializeForm();
          delete data["marca"];

          this._collection.create(data,
              {wait:true, validate:true,
              success: this.success.bind(this),
              error: this.error.bind(this),
            });
      },
      setOptions:function(){

        let cselectors = this.el.querySelectorAll('c-select');

        Promise.all([app.fixedData.marcas.fetch(),app.fixedData.opticas.fetch()])
        .then(
          function(data){

            cselectors[0].options = app.fixedData.opticas.data;
            cselectors[1].options = app.fixedData.marcas.data;

            this._aroChange = function(){
              let val = (this.value || this.options[this.selectedIndex].value);
              let request = app.fixedData.aros.fetch({'marca':this.value});
              request.then(
                function(){
                  cselectors[2].options = app.fixedData.aros.data;
                }
              )
            }

            cselectors[1]._csel.addEventListener('change',this._aroChange,false);

          }.bind(this)
        ).catch(
          (error)=>console.log(error)
        )
      }
    });

    var NewEmpleadoView = GenericNewView.extend({
      templateName: '#newempleado-template',
      constructor: function NewEmpleadoView() {
          NewEmpleadoView.__super__.constructor.apply(this, arguments);
      },
      render: function(){
        let el = GenericNewView.prototype.render.apply(this,arguments);

        el.setAttribute('style',"overflow:auto; height:100%;");

        app.fixedData.opticas.fetch().then(function(){
            this._csel.options = app.fixedData.opticas.data;
        }.bind(this));

        this._csel = el.querySelector('c-select');

        let password_1 = this.el.querySelector('c-input[name="password"]'),
            password_2 = this.el.querySelector('c-input[name="confirmation_password"]');

        password_1.listeners = function(){
          password_2.password = this.value;
        }

        return el;

      },
      submit: function(event){

        event.preventDefault();

        if(!this._cform.validate()) return;

        let data = this._cform.serializeForm();

        let username = data.username,
            email = data.email,
            first_name = data.first_name,
            last_name = data.last_name,
            password = data.password;

        ['username','email','first_name','confirmation_password',
        'password','last_name'].forEach((item)=>{ delete data[item]; });

        data['user.username'] = username;
        data['user.email'] = email;
        data['user.first_name'] = first_name;
        data['user.last_name'] = last_name;
        data['user.password'] = password;

        let form_data = new FormData();

        for ( let key in data )
          form_data.append(key, data[key]);


        $.ajax({
          url: this._collection.url,
          data: form_data,
          cache: false,
          contentType: false,
          processData: false,
          type: 'POST',
          success: function(data){
            employee = data.user.username
            app.eventBus.trigger('message',
            {title:'Se ha agregado a un nuevo usuario...',
            message:[`Se ha agregado a un nuevo empleado: ${employee}
            `],
            extra:""}
            );
          },
          /* REVISAR ESTO */
          error: function(data){
            self.error(data);
          }
        });
      }
    });

    var NewFiltroView = GenericNewView.extend({
      templateName:"#newfiltro-template",
      constructor: function NewFiltroView(){
        NewFiltroView.__super__.constructor.apply(this,arguments);
      },
    })

    var NewLenteView = GenericNewView.extend({
      templateName: '#newlente-template',
      constructor: function NewLenteView() {
          NewLenteView.__super__.constructor.apply(this, arguments);
      },
      render: function(){
        let el = GenericNewView.prototype.render.apply(this,arguments);

        app.fixedData.filtros.fetch()
        .then(
          function(){
            this._csel.options = app.fixedData.filtros.data;
        }.bind(this));

        this._csel = el.querySelector('c-select');

        this._cselCallback = function(){

          let newVal, selected = false;
          if((newVal=this._csel.value) == 0) return;

          let el = this.el.querySelector('div.filtros');

          el.childNodes.forEach(function(item){
            if(item.value == newVal)
              selected = true;
          });

          if(selected){ this._csel._csel.selectedIndex = 0; return; }

          let ctag = createElementWProperties('c-tag',{
            title : this._csel.text,
            name  : 'filters',
            value : this._csel.value,
          });

          el.appendChild(ctag);
          this._csel._csel.selectedIndex = 0;

        }.bind(this);

        this._csel._csel.addEventListener('change',this._cselCallback);
      },
      submit: function (event) {

          event.preventDefault();

          if(!this._cform.validate()) return;

          let data = this._cform.serializeForm();

          delete data['filtros'];

          let filtros = [];

          let tags = this.el.querySelectorAll('div.filtros > c-tag');

          tags.forEach(function(item){ filtros.push(item.value); });

          data['filtro'] = filtros;

          this._collection.create(data,
              {wait:true, validate:true,
              success: this.success.bind(this),
              error: this.error.bind(this),
            });
      },
    })
    /* ALL TABLE VIEWS  */
    var MarcaView = GenericTemplateView.extend({
      constructor: function MarcaView() {
          MarcaView.__super__.constructor.apply(
              this, arguments
          );
      }
    })

    var ProveedorView = GenericTemplateView.extend({
        constructor: function ProveedorView() {
            ProveedorView.__super__.constructor.apply(this, arguments);
        },
    });

    var AroView = GenericTemplateView.extend({
      constructor: function AroView(){
        AroView.__super__.constructor.apply(this, arguments);
      },
    });

    var LaboratorioView = GenericTemplateView.extend({
      constructor: function LaboratorioView(){
        LaboratorioView.__super__.constructor.apply(this, arguments);
      },
    });

    var LenteView = GenericTemplateView.extend({
      constructor: function LenteView(){
        LenteView.__super__.constructor.apply(this,arguments);
      },
    })

    /* Crear una instancia particular de la tabla y del item*/
    var IndependentItemView = ItemView.extend({
      initialize: function(options){
        _.extend(this, _.pick(options, ['destroyModel','showErrors']));
        this._fields = options.fields || null;
        this._deleted = options.deleted;
        ItemView.prototype.initialize.apply(this,[options]);
      },
      deleted: function(){
        if(this._deleted)
          this._deleted();
        else
          ItemView.prototype.deleted.apply(this,arguments);
      },
      renderViewMode: function(){

        $(this.el).html(_.map(this.data,
          function(val, key){

            if(key == "id" || key == "uri" || key == "btn-save"
                || key == "btn-cancel")
                return;

            if(key == this._foreignCollection[0].name)
              return (!val)?'<td>-</td>':`<td>${
                this._foreignCollection[0].data.get(val)}</td>`;

            if(key == this._foreignCollection[1].name)
              return (!val)?'<td>-</td>':`<td>${
                this._foreignCollection[1].data.get(val)}</td>`;

            return `<td>${(!val)?"-":val}</td>`

          },
          this
        ));

        return this;
      },
      renderEditMode: function(){

        $(this.el).html(
          _.map(
              this.data,
              function(val, key){

                if(key == "id" || key == "uri" || key == 'btn-edit'
                    || key == 'btn-del') return;

                if(key == "btn-save" || key == "btn-cancel")
                  return `<td>${val}</td>`;

                if(key == this._foreignCollection[0].name)
                  return  (!val)?`<td><span>-</span><input name="${key}"
                          value = null read-only style="display:none/></td>`:
                          `<td><span>${this._foreignCollection[0].data.get(val)}
                          </span><input name="${key}"
                          value="${val}" read-only style="display:none/></td>`

                if(key == this._foreignCollection[1].name)
                  return  (!val)?`<td><span>-</span><input name="${key}"
                          value = null read-only style="display:none/></td>`:
                          `<td><span>${this._foreignCollection[1].data.get(val)}</span>
                          <input name="${key}"
                          value="${val}" read-only style="display:none/></td>`

                if(key == 'ventas' || key=='fecha')
                  return  `<td>
                          <span>${val}</span>
                          <input name="${key}"
                            value = "${((val==null)?"":val)}" style="display:none" read-only>
                           </td>`;

                return  `<td>
                        <span></span>
                        <input name="${key}"
                          value ="${((val==null)?"":val)}">
                        </td>`;

               }, this
            )
          ); //fin del map a html

      },//fin método renderEditMode
    });

    var IndependentTableView = TableView.extend({
      className:'selected',
      initialize: function(options){
        this._collection = options.collection;
        this._percentages = options.percentages || [];
        this._header      = options.header || [];
        this._subviews    = [];
        this._collection.fetch({reset:true});
        this.el.setAttr(this._percentages, this._header);

        this.el.collection = this._collection;

        function tmp(opt){
          !opt || this.el.getTBody().setAttribute('style','overflow:hidden;');
          !opt && this.el.getTBody().removeAttribute('style');
        }

        this.listenTo(app.eventBus,'iView:error',tmp);
        this.listenTo(app.eventBus,'iView:clearErrors',tmp);
        this.el._cform.collection = this._collection;
        this._foreignCollection = options.foreignCollection || null;

        this._foreignCollectionRequest = Promise.all(
          this._foreignCollection.map(function(item){ return item.fetch();})
        );

          /* El foreginCollectionRequest es una promise */
        this._foreignCollectionRequest.then(function(){
          this._addFilter(this._foreignCollection);
        }.bind(this))


        /*  Listen para hacer el update
            CREO QUE NO ES NECESARIO
        */
        this.listenToOnce(this._collection,'reset',function(){
          this.el.createFooter();
          this.el.renderFooter();
          this._foreignCollectionRequest.then(
            function(){
              this._reRenderTable();
            }.bind(this)
          )
        }.bind(this));

        this.listenTo(this._collection,'update',function(){
          this.el.createFooter();
          this.el.renderFooter();
          this._foreignCollectionRequest.then(
            function(){
              this._reRenderTable();
            }.bind(this)
          )
        }.bind(this));

        this._itemViewOptions = options.itemViewOptions;

        this._extras = options.extras;

      },
      _addFilter: function(collection){

        let fncallback = ()=>{
          this.el.fetchCollection(1);
        }

        collection.forEach(function(item){

          let cselect = createElementWProperties('c-select',{'name':item.name,
                        'title':`${item.name
                        .split('.')
                        .map(w => w[0].toUpperCase() + w.substr(1).toLowerCase())
                        .join('.')
                        }:`});

          cselect.options = item.data;

          cselect.eventCallback = [];
          cselect.eventCallback.push(fncallback);

          cselect._csel.addEventListener('change',fncallback);

          this.el.getFilters().appendChild(cselect);
          this.el.createFilterControl();

        },this);

        if(this._extras)
          this._extras.apply(this);
      },
      _populateTable: function(){

          _(this._collection.models).each(function( model ){

                let data = {
                    model : model,
                    foreignCollection : this._foreignCollection,
                }

                if(this._itemViewOptions)
                  _.extend(data,this._itemViewOptions);

                var iView = new IndependentItemView(data);

                this._subviews.push(iView);

            },this);
      },
    })
    /* fin de la tabla */
    var InventarioDetailView = TemplateView.extend({
      constructor: function InventarioDetailView(){
        InventarioDetailView.__super__.constructor.apply(this, arguments);
      },
      initialize: function(options){
        this.subViews = [];

        this.subViews.push(new IndependentTableView({
          collection:app.inventario,
          header:['Aro','Optica','Fecha','Costo','Stock',
                  'Daño','Venta','',''],
          percentages:[37.5,12.5,10,7.5,7.5,7.5,7.5,5,5],
          foreignCollection: [app.fixedData.opticas,app.fixedData.aros],
          itemViewOptions: {
            destroyModel: function(){
              let aro = this._foreignCollection[1].data.get(this.model.get('aro')),
                  optica = this._foreignCollection[0].data.get(this.model.get('optica'));

              this.model.destroy({
                  wait: true,
                  error : this.error.bind(this),
                  success : function(){
                              this.stopListening();
                              this.destroy_view();
                              app.eventBus.trigger('message',
                                              {title:'Información borrada...',
                                              message:[`Se ha eliminado a ${aro}
                                              de la sucursal ${optica}
                                              `],
                                              extra:""}
                                              );
                          }.bind(this)
              });
            },
            deleted: function(){

              let aro = this._foreignCollection[1].data.get(this.model.get('aro')),
                  optica = this._foreignCollection[0].data.get(this.model.get('optica'));

              app.eventBus.trigger('confirm',{'action':'action'+
                this.model.cid,
                'title':`Está seguro que desea eliminar a: ${aro}
                        de ${optica}`
              });
            },
            showErrors: function(errors){

              if(this.renderCallback == 'renderViewMode')
                app.eventBus.trigger('message',
                  {title:'Hubo un inconveniente...',
                  message:[errors[0].message],
                  extra:""}
                  );
              else
                ItemView.prototype.showErrors.apply(this,[errors])
            }
          },
          extras: function(){

            let cdp = createElementWProperties('c-datepicker',
                                      {title : 'Fecha:',name: 'fecha'});

            this.el.getFilters().appendChild(cdp);

            cdp.callback = function(){

              let data = this.serializeForm();

              app.inventario.fetch({
                data: data
              })
            }.bind(this.el._cform);

          },
        }));

        this.subViews[0].el._cform.submit = function(event){
          event.preventDefault();
          let data = this.serializeForm();
          app.inventario.fetch({
            data: data
          })
        }
      },
      render: function(){

          _(this.subViews).each(function( view ){
              this.el.appendChild(view.el);
          },this);
      },
      destroy: function(){

          _(this.subViews).each(function (view) {
              view.destroy_view();
          }, this);

          //TemplateView.prototype.cleanView.apply(this,arguments);
      }
    })

    var HomePageView = TemplateView.extend({
        events: {

        },
        initialize: function(options){
          this._wrapper = options.contentElement;
          //TemplateView.prototype.initialize.apply(this,arguments);
        },
        render: function(){

        }
    });

    var LoginView = FormView.extend({
        id: 'login',
        events: {
            'submit c-form': 'submit'
        },
        initialize: function(){
          this._cform = this.el.querySelector('c-form');
        },
        _createElement: function(){
            let el  = document.getElementById('login-template').
                          content.cloneNode(true),
                div = document.createElement('div');
            div.appendChild(el);
            return div;
        },
        render: function(){
          return this.el;
        },
        error: function (response, xhr, options) {

          _.each(response.responseJSON,function(error,index){

              let form = document.getElementById('login-form');

              form.setAttribute('ttip',error);
              form.setAttribute('ttip-position','bottom');
              form.reset();

          });

        },
        submit: function (event) {

            event.preventDefault();

            if(!this._cform.validate()) return;

            let data = {};
            //FormView.prototype.submit.apply(this, arguments);
            data = this.el.querySelector('c-form').serializeForm();
            $.post(app.apiLogin, data)
            .done(this.loginSuccess.bind(this))
            .fail(this.error.bind(this));
        },
        loginSuccess: function (data) {
            app.session.save(data);
            this.done();
        }
    });

    var HeaderView = TemplateView.extend({
        tagName: 'header',
        templateName: '#header-template',
        el:'body',
        render: function(){
            let context = this.getContext(),
            html = this.template(context);
            this.$el.prepend(html);
            let img = this.el.querySelector('#profile-picture');
            img.src = app.session.get('photo');
        },
        events: {
          'click #profile-picture':'showMenu',
          'click #log-out': 'logout',
          'click button[role="toggle"]': 'showsidebar',
          'click a[href]':'showsidebar'
        },
        getContext: function () {
          return {authenticated: app.session.authenticated()};
        },
        logout: function(){
          app.session.delete();
        },
        showMenu: function () {
            $(this.el.querySelector('div.logout-form')).toggle();
        },
        showsidebar: function(event){
            if($('nav.sidebar').attr('style')){
                $('nav.sidebar').removeAttr('style');
                $('#main').removeAttr('style');
            }
            else{
                $('nav.sidebar').css('margin-left','0');
                $('#main').css('margin-left','250px');
            }
        }
    });

    var GenericManagerView = TemplateView.extend({
      _gridTemplate: _.template(`<div class="native-grid">
          <div class="sub-item-grid">
            <div class="grid-box-info">
              <span class="fas fa-hand-point-left"></span>
              <h1><center> <%= data.titulos[0] %></center></h1>
              <p>Paso 1: <%= data.parrafos[0] %></p>
              <button id="<%= data.ids[0] %>" class="rounded-btn" value="1">1</button>
              <div class="grid-box-inner">
                  <button class="rounded-btn" name="return"><span class="fas fa-chevron-circle-left" name="return-btn"></span></button>
                  <p>Ir a otro paso</p>
              </div>
            </div>
          </div>
          <div class="sub-item-grid">
            <div class="grid-box-info">
              <span class="fas fa-hand-point-left"></span>
              <h1><center><%= data.titulos[1] %></center></h1>
              <p>Paso 2: <%= data.parrafos[1] %></p>
              <button id="<%= data.ids[1] %>" class="rounded-btn" value="2">2</button>
              <div class="grid-box-inner">
                  <button class="rounded-btn" name="return"><span class="fas fa-chevron-circle-left" name="return-btn"></span></button>
                  <p>Ir a otro paso</p>
              </div>
            </div>
          </div>
          <div class="sub-item-grid">
            <div class="grid-box-info">
            <span class="fas fa-hand-point-left"></span>
              <h1><center><%= data.titulos[2] %></center></h1>
              <p>Paso 3: <%= data.parrafos[2] %></p>
              <button id="<%= data.ids[2] %>" class="rounded-btn" value="3">3</button>
              <div class="grid-box-inner">
                  <button class="rounded-btn" name="return"><span class="fas fa-chevron-circle-left" name="return-btn"></span></button>
                  <p>Ir a otro paso</p>
              </div>
            </div>
          </div>
          <div class="sub-item-grid">
            <div class="grid-box-info">
              <span class="fas fa-hand-point-left"></span>
              <h1><center><%= data.titulos[3] %></center></h1>
              <p>Paso 4: <%= data.parrafos[3] %></p>
              <button id="<%= data.ids[3] %>" class="rounded-btn" value="4">4</button>
              <div class="grid-box-inner">
                  <button class="rounded-btn" name="return"><span class="fas fa-chevron-circle-left" name="return-btn"></span></button>
                  <p>Ir a otro paso</p>
              </div>
            </div>
          </div>
        </div>`),
      renderView: function( view ){
          if(this.current){
            this.current.destroy();
          }
          setTimeout(()=>{
            this.current = view;
            this.current.render();
          },550);
      },
      destroy_view: function(){
          this._modal.destroy_view();
          this._wrapper.remove();
          this._wrapper = null;
          TemplateView.prototype.destroy_view.apply(this,arguments);
      },
      render:function() {
        this._parentNode.appendChild(this.el);
      },
      enableDisableForms: function(render = false,enable = false){
        if(!enable)
          this._gridItems.forEach(item=>{item.disabled = true; render && item.render();},this);
        else
          this._gridItems.forEach(item=>{item.disabled = false; render && item.render();},this);
      },
      cleanNewInvSteps:function(){
        this._gridItems.forEach(item=>item.destroy_view());
        delete this._gridItems;
        delete this._gridItemsContainer;
        while(this._wrapper.firstChild) this._wrapper.firstChild.remove();
      },
      showSelectedForm: function(event){

        let val = event.currentTarget.getAttribute('value');

        this._gridItems[val-1].disabled = false;

        this._gridItemsContainer[val-1].parentNode.classList.add('slide-transition');
        setTimeout(()=>{
          this._gridItemsContainer[val-1].parentNode.classList.remove('slide-transition');
          this._gridItemsContainer[val-1].parentNode.classList.add('individual');
          this._gridItemsContainer[val-1].classList.add('selected');
        },500)

        this._selectedItemIndex = val-1;
        this._gridItems[val-1].disabled = false;
      },
      returnToSteps: function(event){

        if(this._selectedItemIndex < 0 || this._selectedItemIndex > this._max) return;

        this._gridItems[this._selectedItemIndex].disabled = true;
        this._gridItems[this._selectedItemIndex].reset(true);
        this._gridItemsContainer[this._selectedItemIndex].classList.add('slide-transition');
        this._gridItemsContainer[this._selectedItemIndex].classList.remove('selected');
        setTimeout(()=>{
          this._gridItemsContainer[this._selectedItemIndex].classList.remove('slide-transition');
          this._gridItemsContainer[this._selectedItemIndex].parentNode.classList.add('selected');
          this._gridItemsContainer[this._selectedItemIndex].parentNode.classList.remove('individual');
        },500);

        setTimeout(()=>{
          this._gridItemsContainer[this._selectedItemIndex].parentNode.classList.remove('selected');
          delete this._selectedItemIndex;
        },1000);

      },
    })

    var InventarioView = GenericManagerView.extend({
      tagName: 'div',
      templateName: '#inventario-template',
      initialize: function(options){
          /*
          *   this.modal = new ModalView();
          */
          this._modal   = new ModalView();
          this._current = null;
          this._parentNode = options.contentElement;
          this._contentElement  = 'div.section';
          let div = document.createElement('div');
          div.setAttribute('class','menu-bar btn-options');
          div.appendChild(document.getElementById('inventario-template').content.cloneNode(true));
          this.el.appendChild(div);
          this._wrapper = document.createElement('div');
          this._wrapper.setAttribute('class','section');
          this.el.appendChild(this._wrapper);
      },
      events: {
          'click #gest-proveedor':'proveedor',
          'click #gest-marca':'marca',
          'click #new-lote-full':'renderNewInvSteps',
          'click #gest-aro':'aro',
          'click #gest-lote':'inventario',
          'click #new-lote-btn':'showSelectedForm',
          'click #new-prov-btn':'showSelectedForm',
          'click #new-marca-btn':'showSelectedForm',
          'click #new-aro-btn':'showSelectedForm',
          'click button[name="return"]':'returnToSteps',
      },
      showSelectedForm: function(event){

        let val = event.currentTarget.getAttribute('value');
        if(val-1 > 0)
          this._gridItems[val-1].setOptions();

        GenericManagerView.prototype.showSelectedForm.apply(this,arguments);
      },
      proveedor: function(){

        let view = new ProveedorView({
          el: this._contentElement,
          collection:app.proveedor,
          header:['Nombre','Dirección','Teléfono','Teléfono','',''],
          percentages:[20,40,15,15,5,5],
        });

        this.renderView(view);
      },
      marca: function(){

        let view = new MarcaView({
          el:this._contentElement,
          collection:app.marca,
          header:['Nombre','Descripción','Proveedor','',''],
          percentages:[20,50,20,5,5],
          foreignCollection: app.fixedData.proveedores,
        });

        this.renderView(view);
      },
      aro: function(){

        let view = new AroView({
          el:this._contentElement,
          collection:app.aro,
          header:['Modelo','Color','Marca','',''],
          percentages:[20,40,30,5,5],
          foreignCollection: [app.fixedData.marcas,app.fixedData.proveedores],
          fields: ['modelo','color']
        });

        this.renderView(view);

      },
      inventario: function(){

        let view = new InventarioDetailView({
          el:this._contentElement,
          collection:app.inventario,
        });

        this.renderView(view);

      },
      nuevoProveedor: function(){
        let view = new NewProveedorView({
                                          wrapper_el:this._gridItems[0],
                                          collection:app.proveedor,
                                        });
        this.renderView(view);
      },
      nuevoMarca: function(){
        let view = new NewMarcaView({
                                      wrapper_el:this._contentElement,
                                      collection:app.marca,
                                    });
        this.renderView(view);
      },
      nuevoAro: function(){

        let view = new NewAroView({
          wrapper_el:this._contentElement,
          collection:app.aro,
          fields: ['modelo','color'],
        });

        this.renderView(view);

      },
      nuevoInvOptica:function(event){

        let view = new NewInventarioDetailView({
          wrapper_el:this._contentElement,
          collection:app.inventario,
        });

        this.renderView(view);

      },
      renderNewInvSteps: function(){
        if(this._stepsRendered) return;
        this._wrapper.innerHTML = this._gridTemplate({data:{
          titulos: ['Nuevo Proveedor','Nueva Marca','Nuevo Aro','Nuevo Lote'],
          ids: ['new-prov-btn','new-marca-btn','new-aro-btn','new-lote-btn'],
          parrafos: ['Antes de ingresar cualquier registro debe registrar la información del proveedor.',
                    'Seleccione para registrar una nueva marca, previo a esto el proveedor ya debe estar registrado.',
                    'Seleccione para registrar un nuevo modelo de aro. Previo a esto el proveedor y la marca ya deben existir.',
                    'Si el proveedor, marca y tipo de aro a ingresar ya se encuentran ingresados y sólo quiere agregar una nueva entrada, seleccione esta opción.']
          }
        });
        this.el.appendChild(this._wrapper);
        this._gridItemsContainer = this._parentNode.querySelectorAll('div.sub-item-grid');
        /*
        * 0 NewProveedorView
        * 1 NewMarcaView
        * 2 NewAroView
        * 3 NewInventarioDetailView
        */
        this._gridItems = new Array(4)
        this._max = 3;
        this._gridItems[0] = new NewProveedorView({wrapper_el:this._gridItemsContainer[0],
                                          collection:app.proveedor,});
        this._gridItems[1] = new NewMarcaView({wrapper_el:this._gridItemsContainer[1],
                                              collection:app.marca,});
        this._gridItems[2] = new NewAroView({wrapper_el:this._gridItemsContainer[2],
                                      collection:app.aro,
                                      fields: ['modelo','color'],});
        this._gridItems[3] = new NewInventarioDetailView({wrapper_el:this._gridItemsContainer[3],
                                    collection:app.inventario,});

        this.enableDisableForms(true);
        this._stepsRendered = true;
      },
    });

    var LentesAllView = GenericManagerView.extend({
      events: {
          'click #gest-proveedor':'proveedor',
          'click #gest-marca':'marca',
          'click #new-lente-full':'renderNewLenteSteps',
          'click #gest-lente':'tipolente',
          'click #gest-filtros':'filtro',
          'click #gest-laboratorios':'laboratorio',
          'click #new-lente-btn':'showSelectedForm',
          'click #new-lab-btn':'showSelectedForm',
          'click #new-filter-btn':'showSelectedForm',
          'click #new-aro-btn':'showSelectedForm',
          'click button[name="return"]':'returnToSteps',
      },
      initialize: function(options){
        this._modal   = new ModalView();
        this._current = null;
        this._parentNode = options.contentElement;
        this._contentElement  = 'div.section';
        let div = document.createElement('div');
        div.setAttribute('class','menu-bar btn-options');
        div.innerHTML = `<ul class="top-lvl-dd">
          <li>
            <a><label>Subir lente</label></a>
            <ul class="first-lvl-dd">
              <li>
                <button id="new-lente-full">Subir lente</button>
              </li>
              <li>
                <button id="new-lab">Nuevo laboratorio</button>
              </li>
              <li>
                <button id="new-lente">Nuevo lente</button>
              </li>
              <li>
                <button id="new-filter">Nuevo filtro</button>
              </li>
            </ul>
          </li>
          <li>
            <a><label>Gestionar info. lentes</label></a>
            <ul class="first-lvl-dd">
              <li>
                <button id="gest-lente">Gestionar lentes</button>
              </li>
              <li>
                <button id="gest-laboratorios">Gestionar laboratorios</button>
              </li>
              <li>
                <button id="gest-filtros">Gestionar filtros</button>
              </li>
            </ul>
          </li>
          <li>
            <a><label>Imprimir info. lentes</label></a>
            <ul class="first-lvl-dd">
              <li>
                <button id="print-lentes">Imprimir lentes</button>
              </li>
              <li>
                <button id="print-algo">Imprimir</button>
              </li>
            </ul>
          </li>
        </ul>`;
        this.el.appendChild(div);
        this._wrapper = document.createElement('div');
        this._wrapper.setAttribute('class','section');
        this.el.appendChild(this._wrapper);
      },
      nuevoLaboratorio: function(event){

        let view = new NewLaboratorioView({
          wrapper_el:this._contentElement,
          collection:app.laboratorio,
        });

        this.renderView(view);

      },
      laboratorio: function(){
        let view = new LaboratorioView({
          el: this._contentElement,
          collection:app.laboratorio,
          header:['Nombre','Dirección','Teléfono','Teléfono','',''],
          percentages:[20,40,15,15,5,5],
        });
        this.renderView(view);
      },
      nuevoTipolente: function(){

        let view = new NewLenteView({
          wrapper_el:this._contentElement,
          collection:app.lente,
          fields:['color','tipo','material'],
        })

        this.renderView(view);

      },
      filtro: function(event){

        let view = new GenericTemplateView({
          el:this._contentElement,
          collection:app.filtro,
          header:['Filtro','Descripción','',''],
          percentages:[40,50,5,5],
          fields: ['filtro']
        });

        this.renderView(view);
      },
      nuevoLaboratorio: function(event){

        let view = new NewLaboratorioView({
          wrapper_el:this._contentElement,
          collection:app.laboratorio,
        });

        this.renderView(view);

      },
      nuevoFiltro: function(event){
        let view = new NewFiltroView({
          wrapper_el:this._contentElement,
          collection:app.filtro,
          fields:['filtro']
        });

        this.renderView(view);
      },
      tipolente: function(){

        let LenteItemView = ItemView.extend({
          renderViewMode: function(){

            this.el.removeAttribute('style');

            $(this.el).html(
              _.map(this.data,
              function(val, key){
                if(key == "id" || key == "uri" || key == "btn-save"
                    || key == "btn-cancel")
                  return;

                if(this._foreignCollection.name == key)
                  return `<td>[${
                        val.map(function(valor){
                          return (this._foreignCollection.data.get(valor))?
                            this._foreignCollection.data.get(valor):"-";
                        },this).join(' , ')}]
                        </td>`;

                return `<td>${(!val)?"-":val}</td>`

              },this));

            return this;
          },
          renderEditMode: function(){

            this.el.setAttribute('style','height:12vh;');
            $(this.el).html(
              _.map(
                  this.data,
                  function(val, key){
                    if(key == "id" || key == "uri" || key == 'btn-edit'
                        || key == 'btn-del') return;

                    if(key == "btn-save" || key == "btn-cancel")
                      return `<td>${val}</td>`;

                    if(this._foreignCollection.name == key)
                        return `<td>
                            <div class="filters">
                            <select>
                            ${Array.from(this._foreignCollection.data).map(
                              function(value,key){
                                return `<option value='${key}'>${value[1]}</option>`
                              }
                            ).join('')}
                            </select>
                            ${val.map(
                              function(value){
                                return `<c-tag
                                titulo = '${this._foreignCollection.data.get(value)}'
                                name   = 'filters' value  = '${value}'></c-tag>`
                              },this).join(' ')}
                            </div>
                            </td>`;

                    return  `<td>
                            <span></span>
                            <input name="${key}"
                              value ="${((val==null)?"":val)}">
                             </td>`;

                   }, this
                )
              ); //fin del map a html

            let div = this.el.querySelector('div.filters');

            this._fnCallback = function(){

              if(this.value == 0) return;

              let oldTag = false;

              div.childNodes.forEach(
                        (item)=>{ if(item.value == this.value && item !== this)
                            oldTag = true;
                        }, this);

              if(oldTag){ this.selectedIndex = 0; return; }

              let ctag = createElementWProperties('c-tag',{
                title : this.options[this.selectedIndex].text,
                name  : 'filters',
                value : this.value || this.options[this.options.selectedIndex].value,
              });

              div.appendChild(ctag);

              this.selectedIndex = 0;

            }

            this.el.querySelector('select').addEventListener('change',this._fnCallback);


          },//fin método renderEditMode
          cancel:function(){
            if(this._fnCallback){
              this.el.querySelector('select').removeEventListener('change',this._fnCallback);
              this._fnCallback = null;
            }
            ItemView.prototype.cancel.apply(this,arguments);
          },
          destroy_view: function(){

            if(this._fnCallback){
              this.el.querySelector('select').removeEventListener('change',this._fnCallback);
            }

            GenericManagerView.prototype.destroy_view.apply(this,arguments);

          },
          save: function(event){
            this.clearErrors();
            let attributes = {};
            /*  Debemos serializar todos los inputs */
            attributes = _.object(_.map(
                  $(event.currentTarget.parentNode.parentNode).find('input'),
                  function (item) {
                      return [item.name,item.value];
                    }
                  ));

            let ctags = this.el.querySelector('div.filters').querySelectorAll('c-tag'),
                filters = [];

            ctags.forEach((item)=>{ filters.push(item.value);})

            attributes['filtro'] = filters;

            this.model.save(attributes, {
                wait:     true,
                success:  this.success.bind(this),
                error :   this.error.bind(this)
            });
          },
        });

        let view = new LenteView({
          el:this._contentElement,
          collection:app.lente,
          header:['Material','Tipo','Color','Filtros','',''],
          percentages:[20,20,20,30,5,5],
          foreignCollection: app.fixedData.filtros,
          itemView: LenteItemView,
          fields: ['material','color','tipo']
        });

        this.renderView(view);
      },
      renderNewLenteSteps: function(){
        if(this._stepsRendered) return;
        this._wrapper.innerHTML = this._gridTemplate({data:{
          titulos: ['Nuevo Laboratorio','Nuevo Lente','Nueva Filtro','T2'],
          ids: ['new-lab-btn','new-lente-btn','new-filter-btn','new-t2-btn'],
          parrafos: ['Ingresar la información de los laboratorios con los que trabaja.',
                    'Ingresar la información del lente, la combinación de qué tipo puede ir con cada material y color. El laboratorio se agregará al completar la orden',
                    'Seleccione para registrar los filtros disponibles para los lentes, previo a esto el lente ya debe estar registrado.',
                    '-']
          }
        });

        this.el.appendChild(this._wrapper);
        this._gridItemsContainer = this._parentNode.querySelectorAll('div.sub-item-grid');
        this._gridItemsContainer[3].remove();
        this._gridItemsContainer.length = 3;
        /*
        * 0 Nuevo lente
        * 1 Nuevo Filtro
        */
        this._gridItems = new Array(3)
        this._max = 2;
        this._gridItems[0] = new NewLaboratorioView({wrapper_el:this._gridItemsContainer[0],
                                          collection:app.laboratorio,});
        this._gridItems[1] = new NewLenteView({
                                    wrapper_el:this._gridItemsContainer[1],
                                    collection:app.lente,
                                    fields:['color','tipo','material'],
                                  })
        this._gridItems[2] = new NewFiltroView({wrapper_el:this._gridItemsContainer[2],
                                                collection:app.filtro,
                                                fields:['filtro'],});
        this.enableDisableForms(true);
        this._stepsRendered = true;
      },
    });

    var ControlView = TemplateView.extend({
      events:{
        'click button.close':'resetWindow',
      },
      className: 'form-render-container',
      tagName: 'div',
      initialize: function(options){
        this.listenTo(app.eventBus,'edit',(url,type)=>{
          app.opxhr(url,'GET',{}).then((data)=>{
            this.renderForm(JSON.parse(data,type));
          });
        });
        document.getElementById('main').appendChild(this.el);
        this.el.innerHTML = '<button class="close">x</button><div class="split-cell"><div class="portfolio"></div><div class="form-info"></div></div>';
        this._infoRef = this.el.querySelector('div.form-info');
        this._photoRef = this.el.querySelector('div.portfolio');
        this._photoTemplate = _.template(`<div><img src="<%= data.photo %>"><label><%= data.name %></label></div>`);
        this.opticaViewForm = new NewOpticaView({wrapper_el:this._infoRef,collection:app.optica,});
        this.opticaViewForm.el.querySelector('h1').textContent = 'Editar Optica';
      },
      renderForm: function(info,type){
        this.opticaViewForm.render();
        this.opticaViewForm.el.removeAttribute('style');
        this._photoRef.innerHTML = this._photoTemplate({data:{photo:info.photo,name: info.name}});
        this.opticaViewForm.el.querySelector('c-input[name="photo"]').required = false;
        this.el.parentNode.firstElementChild.classList.add('ordenes-hidden');
        this.el.classList.add('down-transition');

        Object.keys(info).forEach((item)=>{
          if(item == 'photo') return;
          let el = this.opticaViewForm.el.querySelector(`c-input[name="${item}"]`);
          if(el){ el.value = (info[item])?info[item]:''; el.validate();}
        },this);
      },
      renderPhoto: function(photoURL, name){
        /*
          1. crear el image
          2. crear el label con el nombre
          3. ?? crear el boton de subir
        */
      },
      resetWindow: function(){
        while(this._infoRef.firstChild) this._infoRef.firstChild.remove();
        this.el.classList.remove('down-transition')
        this.el.parentNode.firstElementChild.classList.remove('ordenes-hidden');
      },
    })

    var ItemViewFormEdit = ItemView.extend({
      initialize: function(options){
        this.data = renderJSON(this.model.attributes);
        delete this.data['btn-cancel'];
        delete this.data['btn-save'];
        this.renderView = options.renderView;
        this.listenTo(app.eventBus,'confirm:action' + this.model.cid,this.destroyModel);
      },
      render: function(){
        this.renderView();
        return this;
      },
      edit: function(){
        app.eventBus.trigger('edit',this.model.get('uri'));
      }
    });

    var OpticaView = TemplateView.extend({
      constructor: function OpticaView(){
        OpticaView.__super__.constructor.apply(this, arguments);
      },
      initialize: function(options){
          this.subViews = [];
          this.subViews.push(new TableView({
            collection:app.optica,
            className: 'ordenes selected',
            header:['Nombre','Dirección','Teléfono','Teléfono','Correo','',''],
            percentages:[10,30,7.5,7.5,35,5,5],
            _populateTable: function(){
              _(this._collection.models).each(function( model, index){
                this._subviews.push(new ItemViewFormEdit({
                  model:model,
                  renderView: function(){
                    this.el.removeAttribute('style');
                    this.el.innerHTML = _.map(this.data, function(val,key,list){
                      if(key!='id' && key!='uri')
                        return `<td>${val}</td>`
                      else
                        return '';
                    }).join('');
                  }
                }))
              },this);
            },
          }));

          this.subViews[0].el._cform.submit = function(event){
              event.preventDefault();
              let data = this.serializeForm();
              app.optica.fetch({
                data: data
              });
          }
          this.subViews.push(new ControlView());
          this.subViews.push(new ModalView());
      },
      render: function(){
        _(this.subViews).each(function( view ){
            this.el.appendChild(view.el);
        },this);
      },
      destroy: function(){

          _(this.subViews).each(function (view) {
              view.destroy_view();
          }, this);

      }
    });

    var SucursalView = GenericManagerView.extend({
      events: {
          'click #gest-sucursal':'sucursal',
          'click #gest-empleados':'empleados',
          'click #new-sucursal-full':'renderNewSucursalSteps',
          'click #gest-permisos':'permisos',
          'click #new-empleados-btn':'showSelectedForm',
          'click #new-sucursal-btn':'showSelectedForm',
          'click button[name="return"]':'returnToSteps',
      },
      initialize: function(options){
        this._modal   = new ModalView();
        this._current = null;
        this._parentNode = options.contentElement;
        this._contentElement  = 'div.section';
        let div = document.createElement('div');
        div.setAttribute('class','menu-bar btn-options');
        div.innerHTML = `<ul class="top-lvl-dd">
          <li>
            <a><label>Registrar Sucursal</label></a>
            <ul class="first-lvl-dd">
              <li>
                <button id="new-sucursal-full">Crear sucursal</button>
              </li>
              <li>
                <button id="new-empleado">Registrar empleado</button>
              </li>
            </ul>
          </li>
          <li>
            <a><label>Gestionar info. sucursal</label></a>
            <ul class="first-lvl-dd">
              <li>
                <button id="gest-sucursal">Gestionar sucursal</button>
              </li>
              <li>
                <button id="gest-empleados">Gestionar empleados</button>
              </li>
              <li>
                <button id="gest-permisos">Gestionar permisos de empleados</button>
              </li>
            </ul>
          </li>
        </ul>`;
        this.el.appendChild(div);
        this._wrapper = document.createElement('div');
        this._wrapper.setAttribute('class','section');
        this.el.appendChild(this._wrapper);
      },
      renderNewSucursalSteps: function(){
        if(this._stepsRendered) return;
        this._wrapper.innerHTML = this._gridTemplate({data:{
          titulos: ['Nueva sucursal','Nuevo empleado','',''],
          ids: ['new-sucursal-btn','new-empleados-btn','t1','t2'],
          parrafos: ['Ingresar la información de la sucursal, esta información será útil para la administración y para mostrar en las órdenes.',
                    'Si ya tiene la información de la sucursal puede ingresar un nuevo usuario.',
                    '',
                    '']
          }
        });

        this.el.appendChild(this._wrapper);
        this._gridItemsContainer = this._parentNode.querySelectorAll('div.sub-item-grid');
        this._gridItemsContainer[2].remove();
        this._gridItemsContainer[3].remove();
        this._gridItemsContainer.length = 2;
        /*
        * 0 Nueva Sucursal
        * 1 Nuevo Empleado
        */
        this._gridItems = new Array(2)
        this._max = 1;
        this._gridItems[0] = new NewOpticaView({wrapper_el:this._gridItemsContainer[0],collection:app.optica,});
        this._gridItems[1] = new NewEmpleadoView({wrapper_el:this._gridItemsContainer[1],collection:app.empleado,});
        this.enableDisableForms(true);
        this._stepsRendered = true;
      },
      returnToSteps: function(event){
        if(this._selectedItemIndex < 0 || this._selectedItemIndex > this._max) return;
        this._gridItems[this._selectedItemIndex].el.scrollTo(0,0);
        GenericManagerView.prototype.returnToSteps.apply(this,arguments);
      },
      sucursal: function(event){

        this.renderView(new OpticaView({
          el:this._contentElement,
          collection:app.optica,
        }));

      },
    });

    app.views.HomePageView    = HomePageView;
    app.views.LoginView       = LoginView;
    app.views.HeaderView      = HeaderView;
    app.views.InventarioView  = InventarioView;
    app.views.LenteView       = LentesAllView;
    app.views.SucursalView    = SucursalView;
    app.views.FormView        = FormView;
    app.views.TemplateView    = TemplateView;
    app.views.ModalView       = ModalView;


})(jQuery, Backbone, _, app);

/*
let createOpt = function(val,key,title){
  let d = document.createElement('option');
  d.value = key;
  d.textContent = (key==0)?val:(`${val} - (${title})`);
  if(title || key == 0)
    this._csel.appendChild(d);
}

opt[0].forEach(function(val,key){
  if(key==0)
    createOpt.apply(this,[val,key]);
  else
    createOpt.apply(this,[val[0],key,opt[1].get(val[1])]);
},this);
*/
