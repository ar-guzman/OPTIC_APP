(function($, Backbone, _, app){

  var calcTotalCost = function(array){

    let total = 0;

    array.forEach(function(item){
      if( item.hasOwnProperty('costo'))
        total += Number(item.costo);
    });

    return total;
  }

  var parseFormData = function(information){

    let obj = [];

    information.forEach(i=>obj.push({}));

    information.forEach(function(item,index){
      Object.keys(item).forEach({

        function(key){

          switch (key) {
            case 'firstname':
              obj[index]['Nombre'] = item[key];
              break;
            case 'lastname':
              obj[index]['Apellido'] = item[key];
              break;
            case 'contact_1':
            case 'contact_2':
              obj[index]['Teléfono'] = item[key];
              break;
            case 'aro':
              obj[index]['Aro'] = app.fixedData.inventario_aros.data(item[key]);
            case 'marca':
              obj[index]['Marca'] = app.fixedData.inventario_marcas.data(item[key]);
            case 'payform':
              obj[index]['Marca'] = app.fixedData.inventario_marcas.data(item[key]);
            default:
              break;

          }
        }//fin función

      });//fin foreach keys
    });//fin foreach object

    return obj;

  }

  var filterOptions = ['fillCollections','render',]

  var orden_template = document.createElement('template'),
      pago_template  = document.createElement('template'),
      modal_client_prompt = `<div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header" style="text-align: center;">
                <h2 class="modal-title"><%- title %></h2>
              </div>
              <div class="modal-body" style="text-align: center;">
                <p><%- message %></p>
                <p name="error"></p>
                <div class="client-items">
                <% options.forEach( function(item, index){ %>
                  <div class="radiogroup">
                    <input type="radio" name="client" id="<%- item.get('id') %>">
                    <label for ="<%- item.get('id') %>"><%= item.get('firstname') + " " + item.get('lastname') + " " + item.get('contact_1') %></label>
                  </div>
                <% })%>
                </div>
                <button class="yes-button">Si</button>
                <button class="no-button" ttip="Presione para guardar como nuevo cliente" ttip-position="right">NC</button>
        </div></div></div>`;

  orden_template.innerHTML = `<div class="left-sidebar"><div></div></div>
                           <button id="close-orden" class="close" ttip="Cancelar la orden" ttip-position="right">X</button>
                           <button id="next-orden"><span class="fa fa-angle-double-right"></span></button>
                           <button style="display:none" id="last-orden">
                           <span class="fa fa-angle-double-left"></span>
                           </button>`;

  pago_template.innerHTML = `<section>
                             <c-form name="Pago">
                               <form  style="padding-top: 0; margin-top:4.5vh;">
                                 <h1><center>Pago</center></h1>
                                 <hr class="linear" />
                                 <div class="split">
                                   <div>
                                     <label class = 'title'> Forma de pago </label>
                                     <div class="radiogroup">
                                       <input type="radio" id="cheque" name="payform" value="1">
                                       <label for="cheque">CHEQUE</label>
                                       <input type="radio" id="efectivo" name="payform" value="2">
                                       <label for="cheque">EFECTIVO</label>
                                       <input type="radio" id="tarjeta" name="payform" value="3">
                                       <label for="tarjeta">CRÉDITO/DÉBITO</label>
                                       <input type="radio" id="sinabono" name="payform" value="0">
                                       <label for="sinabono">SIN ABONO</label>
                                     </div>
                                   </div>
                                   <c-input titulo="Fecha de entrega"
                                   message="Fecha aproximada de entrega para imprimir en la orden"
                                   tipo="datetime-local"
                                   name="entrega"
                                   required></c-input>
                                 </div>
                                 <div class="split">
                                   <c-input
                                   titulo="Descuento (%)"
                                   message="Si desea aplicar un descuento ingrese el número y se calculará automáticamente, el descuento no puede ser mayor a 49%"
                                   pattern = "^[1-4][0-9]$"
                                   name = "discount"
                                   ></c-input>
                                   <c-input
                                   titulo="Cantidad a pagar en quetzales"
                                   pattern="^[1-9][0-9]*(\\.[0-9]{1,2})?$"
                                   name = "payment"
                                   message="Si no se realiza algún abono deje en blanco el campo, si ingresa decimales debe ingresar 2 cifras."></c-input>
                                 </div>
                                 <div class="split">
                                  <div class="information">
                                    <label class="title">Subtotal</label>
                                    <label name="subtotal">1250</label>
                                  </div>
                                  <div class="information">
                                    <label class="title">Total</label>
                                    <label name="total">1000</label>
                                  </div>
                                 </div>
                                 <hr class="linear" />
                                 <button type="submit" id="orden-submit">GENERAR ORDEN</button>
                               </form>
                             </c-form>
   </section>`;

   info_form_template = `<div class="modal-dialog">
     <div class="modal-content">
       <div class="modal-header" style="text-align: center;">
         <h2 class="modal-title"><%- title %></h2>
       </div>
       <div class="modal-body" style="text-align: center;">
         <div class="modal-data-form">
           <% data.forEach( function(item, index){ %>
             <div class="form-label">
              <h1><%= names[index] %></h1>
               <% Object.keys(item).map(i =>  {%>
                 <label><%= i %></label><label><%= item[i] %></label>
                <% }) %>
             </div>
           <% })%>
         </div>
         <button class="yes-button">Si</button>
         <button class="no-button">No</button>
       </div>
     </div>
   </div>`;

   var ModalView     = Backbone.View.extend({
       tagName: 'div',
       className: 'modal',
       attributes: {
           'tabindex':1,
           'style':'display:none'
       },
       initialize: function(){
           this.listenTo(app.eventBus,'confirmClient',this.renderPromptMode);
           this.listenTo(app.eventBus,'renderForm',this.renderPromptFormMode);
           this.templatePrompt = _.template(modal_client_prompt);
           this.templatePromptForm = _.template(info_form_template);
           $('body').append(this.$el);
           this._pressed = 0;
       },
       events: {
           'click button.yes-button': 'sendYes',
           'click button.no-button': 'sendNo',
           'click button.close': 'close',
           'click input[name="client"]':'radioClick',
       },
       radioClick: function(event){

         if(this._pressed){

           let p = this.el.querySelector('p[name="error"]')
           p.classList.remove('error-p');
           p.textContent = "";
           this._preseed = 0;

         }

         this._value = event.currentTarget.value;

       },
       sendYes: function(){

          if(this._value == -1){
            this._pressed = 1;
            let p = this.el.querySelector('p[name="error"]');
            p.textContent = "Si presiona SI es necesario seleccionar un cliente";
            p.classList.add('error-p');
            return;
          }

          if(this._action == 1){
             app.eventBus.trigger('clientResponse',[true,this._value]);
             delete this._action;
             delete this._value;
         }else if(this._action == 2){

         }
         this.close();
       },
       sendNo: function(){
         if(this._action == 1 ){
          app.eventBus.trigger('clientResponse',[true,-1]);
          delete this._action;
          delete this._value;
         }
         else if (this._action == 2){
           delete this._action;
           delete this._value;
         }

         this.close();
       },
       close: function(){
           this.$el.empty();
           this.$el.hide();
       },
       renderPromptMode: function(models){

         this._action =  1;
         this._value  = -1;

         this.$el.html(this.templatePrompt({title:'Este nombre ya se encuentra registrado!!',
                        message:'Seleccione el cliente al que desea asignar la orden de las opciones de abajo, o seleccione NC para nuevo cliente',
                        options:models}));
         this.$el.show();
       },
       renderPromptFormMode: function(data) {

         this._action =  2;

         this.$el.html(this.templatePromptForm({ title:'Información de la orden. Revise antes de guardar',
                                                data:data,names:['cliente','aro','forma de pago']}));
         this.$el.show();

       },
   });

  var TemplateView = Backbone.View.extend({
    destroy_view: function() {
        this.trigger('done');
        // UNBIND the view
        this.undelegateEvents();
        this.stopListening();
        this.$el.removeData();
        this.$el.off();
        this.trigger('done');
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
    },
  })

  var GenericOrdenView = TemplateView.extend({
    events:{
      'click #next-orden':'goToNextSection',
      'click #last-orden':'goToLastSection',
      'click #close-orden':'closeOrden',
      'click button.left-menu-btn':'changeSection',
    },
    initialize: function(options){
      _.extend(this, _.pick(options, filterOptions));
      let tmp = _.template(this.template);
      this.el.innerHTML = tmp();
      this._contentElement = options.contentElement;
      this._formList = [];
      this._formData = [];
      this._clientModel = null;
      this.el.appendChild(pago_template.content.cloneNode(true));
      this.el.appendChild(orden_template.content.cloneNode(true));
      this.el.querySelectorAll('c-form')
              .forEach((item)=>{ this._formList.push(item); this._formData.push({}); },this);
      this._current = 0;
      this._max = this._formList.length - 1;
      this._nextBtn = this.el.querySelector('#next-orden');
      this._backBtn = this.el.querySelector('#last-orden');
      this._checkforclient = false;
      this._renderButtons();
      if(this.fillCollections)
        this.fillCollections();

      this.listenTo(app.eventBus,'clientResponse',(option)=>{
        this._clientModel = option[1];
        this._checkforclient = option[0];
        this.goToNextSection();
      });

      let self = this;

      this._formList[0].submit = function(){

          let formdata = this.serializeForm(),
              data = Object.assign({}, formdata);

          if(Object.keys(self._formData[0]).length > 0 && _.isEqual(self._formData[0],data) ){
              self._checkforclient = true;
              self.goToNextSection();
              return;
          }

          ['contact_2','contact_1'].forEach(item=>{
            delete data[item];
          });

          data['page_size'] = 'all';
          data['partial'] = '';

          app.cliente.fetch({
            data:data,
            validate:true,
            success: function (collection,textStatus,jqXHR) {
              if((self._clientModel = collection.models.find(item => item.get('contact_1') == formdata.contact_1))){
                  self._checkforclient = true;
                  self.goToNextSection();
              }else{
                app.eventBus.trigger('confirmClient',collection.models);
              }
            },
            error: function (jqXHR) {
              self._checkforclient = true;
              self.goToNextSection();
            },
          });
      }

      let cinput = this.el.querySelector('c-input[name="costo"]'),
          cselect = this.el.querySelector('c-select[name="inventario"]'),
          cdate   = this.el.querySelector('c-input[name="entrega"]');


      cinput._extraValidationStep = function(){

        if(cselect.value == ''){

            this.setToolTip('Seleccione un aro antes y luego ingrese el total de la orden');
            return false;

        } else {

            let base_cost = app.fixedData.inventario_aros.data.get(Number(cselect.value))[1];

            if(base_cost > Number(this.value)){
              this.setToolTip(`El costo del lente debe ser mayor a Q.${base_cost}`);
              return false;
            }
        }

          return true;
      }

      cdate._today = new Date();
      cdate._extraValidationStep = function(){

        this._tmpDate = this.value.split('T')[0].split('-');
        this._tmpTime = this.value.split('T')[1].split(':');
        let returnVal = true;
        if( this._tmpDate[0] < this._today.getFullYear() ){
          this.setToolTip('Debe seleccionar una fecha válida de entrega');
          returnVal = false;
        }
        if( this._tmpDate[1] < this._today.getUTCMonth() + 1 ){
          this.setToolTip('Debe seleccionar una fecha válida de entrega');
          returnVal = false;
        }

        if( this._tmpDate[2] <= this._today.getUTCDate() ){
          this.setToolTip('Debe seleccionar una fecha válida de entrega');
          returnVal = false;
        }

        if( this._tmpTime[0] < 9 || this._tmpTime[0] > 18){
          this.setToolTip('Debe seleccionar un horario válido de entrega');
          returnVal = false;
        }

        delete this._tmpDate;
        delete this._tmpTime;
        return returnVal;

      }

    },
    closeOrden: function () {

      let currentForm = this._formList[this._current];
      currentForm.parentNode.classList.add('slide-transition');
      currentForm.parentNode.classList.remove('selected');

      setTimeout(this.destroy_view.bind(this),1000);

    },
    _renderButtons:function(){

      let div = this.el.querySelector('div.left-sidebar div');

      div.innerHTML = (this._formList.map((form,index)=>
              `<button class="${(!index)?"active ":""}left-menu-btn" ttip=${form.getAttribute('name')}
               ttip-position="left" value="${index}" ${(!index)?"":'disabled'}></button>`).join(''));
    },
    goToNextSection:function(){

      if(this._current >= this._max) return;

      let currentForm = this._formList[this._current],
          currentButton = this.el.querySelector(`button[ttip="${currentForm.getAttribute('name')}"]`);

      if(currentForm.validate()){

        let nextForm = this._formList[this._current + 1],
            nextButton = this.el.querySelector(`button[ttip=${nextForm.getAttribute('name')}]`);

        if(this._current == 0 && currentForm.getAttribute('name')=='Cliente' && !this._checkforclient){
          currentForm.submit();  return;
        }

        currentButton.classList.remove('active');
        nextButton.classList.add('active');
        nextButton.removeAttribute('disabled');
        currentForm.parentNode.classList.add('slide-transition');
        currentForm.parentNode.classList.remove('selected');

        setTimeout(()=>{
          currentForm.parentNode.removeAttribute('class');
          nextForm.parentNode.setAttribute('class','selected');
          this._backBtn.removeAttribute('style');
        },1000);


        _.extend(this._formData[this._current],currentForm.serializeForm());

        this._current = this._current + 1;

        if(this._current == this._max){

          this._nextBtn.setAttribute('style','display:none');

          let cinput = this.el.querySelector('c-input[name="discount"]'),
              label  = this.el.querySelector('label[name="total"]'),
              sublabel  = this.el.querySelector('label[name="subtotal"]');


          let costo = calcTotalCost(this._formData);

          sublabel.textContent = costo.toFixed(2);
          label.textContent = costo.toFixed(2);

          cinput._extraValidationStep = function(){

            if(!this.value)
              label.textContent = costo.toFixed(2);

            else{
              label.textContent = ((1 - Number(this.value/100))* costo).toFixed(2)
            }

            return true;
          }// fin extra validate

        }

      }
    },
    goToLastSection: function(){

      if(this._current <= 0) return;

      let currentForm = this._formList[this._current],
          currentButton = this.el.querySelector(`button[ttip="${currentForm.getAttribute('name')}"]`);

      if(currentForm.validate()){

        let lastForm = this._formList[this._current - 1],
            lastButton = this.el.querySelector(`button[ttip=${lastForm.getAttribute('name')}]`);

        currentButton.classList.remove('active');
        lastButton.classList.add('active');
        currentForm.parentNode.classList.add('slide-transition');
        currentForm.parentNode.classList.remove('selected');

        setTimeout(()=>{
          currentForm.parentNode.removeAttribute('class');
          lastForm.parentNode.setAttribute('class','selected');
          this._nextBtn.removeAttribute('style');
        },1000);

        this._current = this._current - 1;

        if(this._current == 0){ this._backBtn.setAttribute('style','display:none');}
      }
    },
    changeSection: function(event){

      let clickedButton = event.currentTarget,
          currentButton = this.el.querySelector('button.left-menu-btn.active'),
          currentForm   = this.el.querySelector(`c-form[name=${currentButton.getAttribute('ttip')}]`),
          wantedForm    = this.el.querySelector(`c-form[name=${clickedButton.getAttribute('ttip')}]`);


      if (clickedButton === currentButton) return;

      if(currentForm.validate()){

        currentButton.classList.remove('active');
        clickedButton.classList.add('active');
        currentForm.parentNode.classList.add('slide-transition');
        currentForm.parentNode.classList.remove('selected');

        setTimeout(()=>{
          currentForm.parentNode.removeAttribute('class');
          wantedForm.parentNode.setAttribute('class','selected');
        },1000);

        this._current = Number(clickedButton.getAttribute('value'));

        if(this._current == 0) this._backBtn.setAttribute('style','display:none');
        else this._backBtn.removeAttribute('style');
        if(this._current == this._formList.length-1 ) this._nextBtn.setAttribute('style','display:none');
        else this._nextBtn.removeAttribute('style');
      }

    },
    render:function(){
      this._contentElement.appendChild(this.el);
    }
  });

  var OrdenAroView = GenericOrdenView.extend({
    events: function(){
      return _.extend(GenericOrdenView.prototype.events,{'submit c-form':'submit'});
    },
    className: 'section-list',
    template:`<section class = "selected"><c-form name="Cliente"><form>
              <h1><center>Datos del cliente<center></h1>
              <hr class="linear" />
              <div class="split">
                <c-input
                message = "El nombre del cliente es obligatorio"
                titulo = "Nombre del cliente"
                name = "firstname"
                pattern = "^[A-Za-záéíñóúüÁÉÍÑÓÚÜ\\s]+$"
                required
                ></c-input>
                <c-input
                titulo  = "Apellido del cliente"
                name = "lastname"
                required
                message = "El apellido del cliente es obligatorio"
                pattern = "^[A-Za-záéíñóúüÁÉÍÑÓÚÜ\\s]+$"></c-input>
              </div>
              <div class="split">
                <c-input
                message = "Este número de contacto es obligatorio."
                titulo = "Número de contacto"
                name = "contact_1"
                required
                pattern = "^[0-9]{8,8}$"
                ></c-input>
                <c-input
                message = "Este número de contacto es opcional."
                name = "contact_2"
                titulo = "Número de contacto"
                pattern = "^[0-9]{8,8}$"
                ></c-input>
              </div>
              <hr class="linear" />
            </form>
          </c-form>
        </section>
        <section>
          <c-form name="Aro">
            <form style="margin-top:15px;">
              <h1><center>Elección del aro</center></h1>
              <hr class="linear" />
              <% if(!app.session.get('sucursal')){ %>
                <div class='split'><c-select titulo ='Sucursal de la orden' name='optica' show
                message = "Seleccione la sucursal donde se encuentra para obtener la lista de marcas disponibles, de acuerdo a la disponibilidad se mostrarán las opciones">
                </c-select>
              <% }else{  %>
                <div class='split'>
              <% } %>
              <c-select titulo ="Marca del aro" name="marca" show
              message = "Seleccione primero la marca, de acuerdo a la disponibilidad se mostrarán las opciones">
              </c-select>
              <% if(!app.session.get('sucursal')) { %>
                </div><div class="split">
              <% } %>
              <c-select titulo ="Nombre y color" name="inventario" show
              message = "Opciones de aros disponibles según la marca elegida."
              ></c-select>
              <% if(app.session.get('sucursal')) { %>
                </div>
              <% } %>
              <c-input
              message = "El costo de venta del aro es obligatorio, si el costo es menor no podrá proseguir"
              titulo = "Costo de venta del aro"
              name = "costo"
              required
              pattern = "^[1-9][0-9]*(\\.[0-9]{1,2})?"
              ></c-input><% if(!app.session.get('sucursal')){ %></div><% } %>
              <label class='title'>Observaciones:</label>
              <textarea placeholder="Algún comentario a agregar o si al aro se le da una venta adicional"
              rows="3"></textarea>
              <hr class="linear" />
            </form></c-form></section>`,
        fillCollections: function(){

          let arocsel = this.el.querySelector('c-select[name="inventario"]'),
              marcacsel = this.el.querySelector('c-select[name="marca"]'),
              self = this;


          if(!app.session.get('sucursal')){

            let opticaCsel = this.el.querySelector('c-select[name="optica"]');

            app.fixedData.opticas.fetch().then(function(){
                opticaCsel.options = app.fixedData.opticas.data;
            });

            opticaCsel.listeners = function() {

              let value = this.value;

              if(!value){ marcacsel.clear(); arocsel.clear(); return; }

              request = app.fixedData.inventario_marcas.fetch({orden:true, optica:value});

              self._opticaID = this.value;

              request.then( function(){
                marcacsel.options = app.fixedData.inventario_marcas.data;
              });

            }.bind(opticaCsel);

          }else{

            this._opticaID = app.session.get('sucursal');

            app.fixedData.inventario_marcas.fetch({orden:true, optica:this._opticaID})
            .then(
                ()=>{marcacsel.options = app.fixedData.inventario_marcas.data;}
            )

          }

          marcacsel.listeners = function(){

            if(!this.value){ arocsel.clear(); return; }

            request = app.fixedData.inventario_aros.fetch({optica:self._opticaID,orden:true,marca:this.value});

            request.then(function(){
              arocsel.options = app.fixedData.inventario_aros.data;
            });

          }.bind(marcacsel)
      },
      submit: function(event) {

        event.preventDefault();

        let radios = this.el.querySelectorAll('input[name="payform"]'),
            selected = Array.prototype.find.call(radios, (child)=> child.checked),
            div = this.el.querySelector('div.radiogroup');

        if(selected === undefined){
          div.setAttribute('ttip','Debe seleccionar alguna opción antes de guardar');
          return;
        }else
          div.removeAttribute('ttip');

        if(!this._formList[this._max].validate()) return;

        let abono = this.el.querySelector('c-input[name="payment"]'),
            total = this.el.querySelector('label[name="total"]').textContent;

        alert(selected);
        if(selected.value != 0 && !abono.value){
          abono.setToolTip('Debe ingresar la cantidad a abonar');
          return;
        }else if(selected.value != 0 && abono.value && abono.value > total){
          abono.setToolTip('La cantidad a abonar no puede superar el total de la orden');
          return;
        }else
          abono.setToolTip();


        _.extend(this._formData[this._max],this._formList[this._max].serializeForm());

        this._formData[this._max].payform = selected.value;

        app.eventBus.trigger('renderForm', this._formData);

      }
  });


  var OrdenesView = TemplateView.extend({
    className: "menu-bar btn-options",
    events:{
      'click #orden-completa':'complete_order',
      'click #orden-aro':'aro_order',
      'click #orden-reparación':'repair_order',
      'click #orden-lente':'lens_order',
      'click #orden-examen':'test_order',
    },
    initialize: function(options){
       this._modal = new ModalView();
       this._current = null;
       this.el.appendChild(document.getElementById('orden-template').content.cloneNode(true));
       this._contentElement = options.contentElement;
     },
     aro_order:function(){
       this.renderView(new OrdenAroView({contentElement:this._contentElement}));
     },
     renderView: function(view){
       let menubar = this.el;
       this.el.setAttribute('style','display:none');
       if(this._current){
         this._current.destroy_view();
       }
       this._current = view;
       view.on('done',()=>{ menubar.removeAttribute('style');});
       this._current.render();
     },
     renderMenu: function(){
       this._current.destroy();
       this._current = null;
     },
     render:function(){
       this._contentElement.appendChild(this.el);
     },
     destroy: function() {
       if(this._current)
         this._current.destroy_view();

       this._modal.destroy_view();
       TemplateView.prototype.destroy_view.apply(this,arguments);
     }
   });

   app.views.OrdenesView = OrdenesView;

})(jQuery, Backbone, _, app);
