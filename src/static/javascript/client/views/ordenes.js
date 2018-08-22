(function($, Backbone, _, app){

  var createElement = function(type,properties,custom){

    let el = document.createElement(type);
    if(custom){
      Object.keys(properties).forEach(data=>{
        el[data] = properties[data];
      });
      return el;
    }

    Object.keys(properties).forEach(key=>{
      if(key=="textContent")
        el.textContent = properties[key];
      else
        el.setAttribute(key,properties[key]);
    });

    return el;
  }
  var calcTotalCost = function(array){

    let total = 0;

    array.forEach(function(item){
      if( item.hasOwnProperty('costo'))
        total += Number(item.costo);
    });

    return total;
  }
  var parseFormData = function(information){

    let obj = [], pointer = 0;

    information.forEach(i=>obj.push({}));

    information.forEach(function(item,index){

      if(index == 1 && Array.isArray(item)){

        pointer = (!item[1])?0:(item[0].checked)?0:(item[1].checked)?1:0;

        Object.keys(item[pointer]).forEach(function(subitems){

          switch (subitems) {
            case 'ASC-OD-FAR':
              obj[1]['OD LEJOS'] = Object.keys(item[pointer][subitems]).map(function(llave){
                                      return llave+": "+item[pointer][subitems][llave];
                                   }).join(' ')
              break;
            case 'ASC-OS-FAR':
              obj[1]['OS LEJOS'] = Object.keys(item[pointer][subitems]).map(function(llave){
                                      return llave+": "+item[pointer][subitems][llave];
                                   }).join(' ')
              break;
            case 'ASC-OD-CLOSE':
              obj[1]['OD CERCA'] = Object.keys(item[pointer][subitems]).map(function(llave){
                                      return llave+": "+item[pointer][subitems][llave];
                                   }).join(' ')
              break;
            case 'ASC-OS-CLOSE':
              obj[1]['OS CERCA'] = Object.keys(item[pointer][subitems]).map(function(llave){
                                      return llave+": "+item[pointer][subitems][llave];
                                   }).join(' ')
              break;
            case 'PRISMA-ADD-OD':
              let tmpod = item[pointer][subitems]['base'];
              obj[1]['PRISMA OD'] = 'prisma: '+item[pointer][subitems]['prisma']+" base:"+
                                    (tmpod==0)?'-':(tmpod==1)?'inferior':(tmpod==2)?'exterior':'otra';
              obj[1]['ADD OD'] = item[pointer][subitems]['add'];
              break;
            case 'PRISMA-ADD-OS':
              let tmpos = item[pointer][subitems]['base'];
              obj[1]['PRISMA OS'] = 'prisma: '+item[pointer][subitems]['prisma']+" base:"+
                                    (tmpos==0)?'-':(tmpos==1)?'inferior':(tmpos==2)?'exterior':'otra';
              obj[1]['ADD OS'] = item[pointer][subitems]['add']
              break;
            case 'dp-lejos-cerca':
              obj[1]['DP'] = Object.keys(item[pointer][subitems]).map(function(llave){
                                      return llave+": "+item[pointer][subitems][llave];
                                   }).join(' ')
              break;
            default:
              obj[1]['ORIGEN'] = (item[pointer][subitems])?'EXTERNA':'OPTICA';
              break;
          }

        })

      }else
        Object.keys(item).forEach(function(key){

            switch (key) {
              case 'firstname':
                obj[index]['NOMBRE'] = item[key];
                break;
              case 'lastname':
                obj[index]['APELLIDO'] = item[key];
                break;
              case 'contact_1':
                  obj[index]['TELÉFONO'] = item[key];
                  break;
              case 'contact_2':
                obj[index]['RESPALDO'] = item[key];
                break;
              case 'inventario':
                obj[index]['ARO'] = app.fixedData.inventario_aros.data.get(Number(item[key]))[0];
                break;
              case 'marca':
                obj[index]['MARCA'] = app.fixedData.inventario_marcas.data.get(Number(item[key]));
                break;
              case 'entrega':
                let fecha = new Date(item[key])
                obj[index]['FECHA DE ENTREGA'] = fecha.toLocaleDateString();
                obj[index]['HORA DE ENTREGA'] = fecha.toLocaleTimeString();
                break;
              case 'payform':
                let s = (item[key]==0)?'Sin abonar':(item[key]==1)?'Cheque':(item[key]==2)?'Efectivo':'Tarjeta';
                obj[index]['FORMA DE PAGO'] = s;
                break;
              case 'payment':
                obj[index]['ABONADO'] = (!item[key])?0:item[key];
                break;
              case 'discount':
                obj[index]['DESCUENTO'] = (!item[key])?0:item[key];
                break;
              case 'total':
                obj[index][key.toUpperCase()] = item[key];
                break;
              case 'lente':
                obj[index]['TIPO'] = app.fixedData.lentes.data.get(Number(item[key]))[0];
                obj[index]['MATERIAL'] = app.fixedData.lentes.data.get(Number(item[key]))[1];
                obj[index]['COLOR'] = app.fixedData.lentes.data.get(Number(item[key]))[2];
                break;
              case 'filtros':
                obj[index]['FILTROS'] = item[key].map(valor=>{
                  return app.fixedData.filtros.data.get(Number(valor));
                }).join(' , ')
              default:
                break;
              }
          });//fin foreach keys

    });//fin foreach object

    return obj;

  }
  var setSelectColor = function(select,disable = true){
    switch (select.value) {
      case "0":
        select.setAttribute('style','background:#47b8bd;');
        break;
      case "1":
        select.setAttribute('style','background: #2a6398;');
        break;
      case "2":
        select.setAttribute('style','background:#24b944;');
        if(disable)
          select.setAttribute('disabled','');
        break;
      case "3":
        select.setAttribute('style','background: #232323;color:white;');
        break;
      case "4":
        select.setAttribute('style','background:#ff3f3f;');
        if(disable)
          select.setAttribute('disabled','');
        break;
      default:
        select.removeAttribute('style');
    }
  }
  var statusText = function(value){

    switch (Number(value)) {
      case 0:
        return 'Pendiente';
      case 1:
        return 'Listo';
      case 2:
        return 'Entregado';
      case 3:
        return 'Con Problemas';
      case 4:
        return 'Cancelado';
      default:
        return 'ERROR!!!!!!';
      }

  }
  /* INICIO DE FUNCIONES DE REFRACCION */
  var _ejeValidation = function(){

    if(this.checkValidity()){
      this.parentNode.removeAttribute('ttip');
      this.removeAttribute('class');
      return true;
    }
    if(this.validity.rangeOverflow || this.validity.rangeUnderflow || this.validity.stepMismatch){
      this.parentNode.setAttribute('ttip',"Valor debe estar en un rango entre 0 y 180, sin decimales");
      this.setAttribute('class','error-p');
      return false;
    }
  },
  _esferaValidation = function(){

    if(this.checkValidity()){
      this.parentNode.removeAttribute('ttip');
      this.removeAttribute('class');
      return true;
    }
    if(this.validity.rangeOverflow || this.validity.rangeUnderflow || this.validity.stepMismatch){
      this.parentNode.setAttribute('ttip',"Valor debe estar en un rango entre -20 y +20, y variar por .25");
      this.setAttribute('class','error-p');
      return false;
    }
  },
  _cilindroValidation = function(){

    if(this.checkValidity()){
      this.parentNode.removeAttribute('ttip');
      this.removeAttribute('class');
      return true;
    }

    if(this.validity.rangeOverflow || this.validity.rangeUnderflow || this.validity.stepMismatch){
      this.parentNode.setAttribute('ttip',"Valor debe estar en un rango entre 0 y -10, y variar por .25");
      this.setAttribute('class','error-p');
      return false;
    }
  },
  receta = function(propio = true){

    let cforms = this.querySelectorAll('c-form'),
        data = {}, checked = this.querySelector('input[type="checkbox"]'),
        textarea = this.querySelector('textarea');

    if(propio)
      data.propio = checked.checked;

    cforms.forEach(item=>{
      data[item.name] = item.serializeForm(true);
    });

    data.observaciones = textarea.value;

    return data;

  }

  var createCashDiv = function(connectedElement){

    let div = createElement('div',{'class':'split'});

    div.innerHTML = `<c-input
     pattern="^[1-9][0-9]+(\\.[0-9]{1,2})?$"
     titulo = "Cantidad recibida (Q.)"
     message = "Número, máximo 2 decimales. El cambio se calculará automáticamente"
     name = "recibida"
     required></c-input>
     <div class="information">
        <label class="title">Cambio (Q.)</label>
        <label name="change">0</label>
      </div>`;

     let label = div.querySelector('label[name="change"]');

     div.querySelector('c-input')._extraValidationStep = function(){

       if(Number(connectedElement.value) == 0){
         connectedElement.setToolTip('Este campo no puede tener un valor vacio, para dejarlo en blanco seleccione la opción "Sin Abono"');
         this.setToolTip('Debe llenar el campo "cantidad a pagar" antes de llenar este campo');
         return false;
       }
       if(this.value == "0"){
          this.setToolTip('El valor ingresado no puede ser menor a 0');
          return false;
        }
        else if (Number(this.value) < Number(connectedElement.value)){
          this.setToolTip('El valor ingresado no puede ser menor al que se desea abonar');
          return false;
        }

        label.textContent = (Number(this.value) - Number(connectedElement.value)).toFixed(2);
        return true;
     }

     return div;

  }
  /* FIN DE FUNCIONES DE REFRACCION */
  var filterOptions = ['fillCollections','render',]

  var orden_template = document.createElement('template'),
      pago_template  = document.createElement('template'),
      lens_template = document.createElement('template'),
      refraction_template = document.createElement('template'),
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
                    <input type="radio" name="client" value="<%- item.get('id') %>">
                    <label for ="<%- item.get('id') %>"><%= item.get('firstname') + " " + item.get('lastname') + " " + item.get('contact_1') %></label>
                  </div>
                <% })%>
                </div>
                <% if(!buttons){ %>
                  <button class="yes-button squared">Antiguo</button>
                  <button class="no-button squared" ttip="Presione para guardar como nuevo cliente" ttip-position="right">Nuevo</button>
                <% } else{ %>
                  <button class="yes-button squared">No</button>
                  <button class="no-button squared" ttip="Presione para registrar otra receta" ttip-position="right">Adicional</button>
                <% } %>
        </div></div></div>`,
  abono_form_template = `<form>
      <h1>Nuevo Abono</h1>
      <hr class="linear"/>
      <div class="ordenes-static-info">
      <div class="split">
        <div>
          <label class = 'title'> Forma de pago </label>
          <div class="radiogroup">
            <input type="radio" id="cheque" name="payform" value="1">
            <label for="cheque">CHEQUE</label>
            <input type="radio" id="efectivo" name="payform" value="2">
            <label for="efectivo">EFECTIVO</label>
            <input type="radio" id="tarjeta" name="payform" value="3">
            <label for="tarjeta">CRÉDITO/DÉBITO</label>
            <input type="radio" id="sinabono" name="payform" value="0">
            <label for="sinabono">SIN ABONO</label>
          </div>
          <label class="legend">Debe seleccionar alguna forma de pago, si no seleccione sin abono</label>
        </div>
        <c-input
        titulo="Cantidad a pagar (Q.)"
        pattern="^[1-9][0-9]+(\\.[0-9]{1,2})?$"
        name = "payment"
        required
        message="Si ingresa decimales debe ingresar 1 o 2 cifras."></c-input>
        </div>
        <div class="split">
           <div class="information">
             <label class="title">Abonado (Q.)</label>
             <label name="abonado"><%= model.get('abonado') %></label>
           </div>
           <div class="information">
             <label class="title">Pendiente (Q.)</label>
             <label name="saldo"><%= (model.get('total')-model.get('abonado')) %></label>
           </div>
          </div>
        <div class="split" style="margin-top:1vh">
          <c-input titulo="Fecha del abono"
          message="Fecha de nuevo abono si se atrasó en registrarlo, el formato es MES/DIA/AÑO, si se deja en blanco se tomará hoy por defecto."
          tipo="date"
          name="fecha"
          ></c-input>
          <div class="information">
            <button id="abono-save">Guardar <span class="fab fa-telegram-plane"></span></button>
            <button type="button" id="abono-cancel">Cancelar <span class="fa fa-times"></span></button>
          </div>
        </div>
      </div>
    </form>`

  orden_template.innerHTML = `<div class="left-sidebar"><div></div></div>
                           <button id="close-orden" class="close" ttip="Cancelar la orden" ttip-position="right">x</button>
                           <button id="next-orden"><span class="fa fa-angle-double-right"></span></button>
                           <button style="display:none" id="last-orden">
                           <span class="fa fa-angle-double-left"></span>
                           </button>`;

  pago_template.innerHTML = `<section>
                             <c-form name="Pago">
                               <form>
                                 <h1>Pago</h1>
                                 <hr class="linear" />
                                 <div class="split">
                                   <c-input
                                   titulo="Descuento (Q.)"
                                   message="Si desea aplicar un descuento ingreselo acá"
                                   pattern="^[1-9][0-9]+(\\.[0-9]{1,2})?$"
                                   name = "discount"
                                   ></c-input>
                                   <c-input titulo="Fecha de entrega"
                                   message="Fecha aproximada de entrega para imprimir en la orden, el formato es MES/DIA/AÑO"
                                   tipo="datetime-local"
                                   name="entrega"
                                   required></c-input>
                                 </div>
                                 <div class="split">
                                   <div>
                                     <label class = 'title'> Forma de pago </label>
                                     <div class="radiogroup">
                                       <input type="radio" id="cheque" name="payform" value="1">
                                       <label for="cheque">CHEQUE</label>
                                       <input type="radio" id="efectivo" name="payform" value="2">
                                       <label for="efectivo">EFECTIVO</label>
                                       <input type="radio" id="tarjeta" name="payform" value="3">
                                       <label for="tarjeta">CRÉDITO/DÉBITO</label>
                                       <input type="radio" id="sinabono" name="payform" value="0">
                                       <label for="sinabono">SIN ABONO</label>
                                     </div>
                                     <label class="legend">Debe seleccionar alguna forma de pago, si no seleccione sin abono</label>
                                   </div>
                                   <c-input
                                   titulo="Cantidad a pagar(Q.)"
                                   pattern="^[1-9][0-9]+(\\.[0-9]{1,2})?$"
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

   lens_template.innerHTML = `<section>
    <c-form name="Lente">
      <form>
        <h1>Lente</h1>
        <hr class="linear">
        <div class="split">
          <c-select titulo="Tipo de lente"
              name="tipo"
              message="Seleccione el tipo de lente a vender."
              show
              ></c-select>
          <c-select titulo="Material de lente"
              message="Seleccione el material de lente a vender, sólo se mostrarán los materiales permitidos para el tipo de lente."
              name="material"
              show></c-select>
        </div>
        <div class="split">
          <c-select titulo="Color de lente"
              message="Seleccione el color de lente a vender, si no está la combinación que busca ingresarla o comunicarse con el administrador."
              name="lente"
              show></c-select>
          <c-select
              titulo = "Filtro"
              name = "filtro"
              message = "Tipos de filtros válidos para las opciones elegidas"
              ></c-select>
            </div>
          <div class="split">
            <div>
              <label class="title">Filtros</label>
              <div class="filtros"></div>
            </div>
            <c-input
              name="costo"
              required
              titulo = "Costo de venta"
              message = "Costo de venta del lente (para fines administrativos), debe ser un número"
              pattern = "^[1-9][0-9]+(\.[0-9]{1,2})?"></c-input>
          </div>
        </div>
        <hr class="linear">
      </form>
   </section>`

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
              <hr class="linear">
               <% Object.keys(item).map(i =>  {%>
                 <div>
                 <label><%= i %>:</label><label><%= item[i] %></label>
                 </div>
                <% }) %>
             </div>
           <% })%>
         </div>
         <button class="yes-button squared">Guardar</button>
         <button class="no-button squared">Cancelar</button>
       </div>
     </div>
   </div>`;

   refraction_template_string = `<div class="asc-container">
     <div class="odos-dist">
       <label>Lejos</label><label>Cerca</label></div>
     <div class="asc-form">
       <div class="asc-titulos"><label>Esfera</label><label>Cilindro</label><label>Eje</label></div>
       <div class="asc-far">
         <c-form name="ASC-OD-FAR">
           <div>
             <label>O.D.</label>
             <span><input name="esfera" type="number" value="0" step=".25" max="20" min="-20"></span>
             <span><input name="cilindro" type="number" value="0" max="0" min="-10" step=".25"></span>
             <span><input name="eje" type="number" value="0" max="180" min="0"></span>
           </div>
         </c-form>
         <c-form name="ASC-OI-FAR">
           <div>
             <label>O.S.</label>
             <span><input name="esfera" type="number" value="0" step=".25" max="20" min="-20"></span>
             <span><input name="cilindro" type="number" value="0" max="0" min="-10" step=".25"></span>
             <span><input name="eje" type="number" value="0" max="180" min="0"></span>
           </div>
         </c-form>
       </div>
       <div class="asc-far">
         <c-form name="ASC-OD-CLOSE">
           <div>
             <label>O.D.</label>
             <span><input name="esfera" type="number" value="0" step=".25" max="20" min="-20"></span>
             <span><input name="cilindro" type="number" value="0" max="0" min="-10" step=".25"></span>
             <span><input name="eje" type="number" value="0" max="180" min="0"></span>
           </div>
         </c-form>
         <c-form name="ASC-OI-CLOSE">
           <div>
             <label>O.S.</label>
             <span><input name="esfera" type="number" value="0" step=".25" max="20" min="-20"></span>
             <span><input name="cilindro" type="number" value="0" max="0" min="-10" step=".25"></span>
             <span><input name="eje" type="number" value="0" max="180" min="0"></span>
           </div>
         </c-form>
     </div>
   </div>
 </div>
 <div class="padp-form">
   <div class="pa-container">
     <div class="pa-dist"><label>O.D.</label><label>O.S.</label></div>
     <div class="pa-form">
       <div class="pa-titulos"><label>Prisma</label><label>ADD</label></div>
       <div class="pa-osd">
         <c-form name="PRISMA-ADD-OD">
           <div>
             <input name="prisma" type="number" value="0">
             <select name="base">
               <option value="0" select>Base</option>
               <option value="1">Interna</option>
               <option value="2">Externa</option>
               <option value="3">Inferior</option>
               <option value="4">Superior</option>
             </select>
           </div>
           <div><input name="add" type="number" value="0"></div>
         </c-form>
         <c-form name="PRISMA-ADD-OS">
           <div>
             <input name="prisma" type="number" value="0">
             <select name="base">
               <option value="0" select>Base</option>
               <option value="1">Interna</option>
               <option value="2">Externa</option>
               <option value="3">Inferior</option>
               <option value="4">Superior</option>
             </select>
             </div>
           <div><input name="add" type="number" value="0"></div>
         </c-form>
       </div>
     </div>
   </div>
   <div class="dp-container">
     <div class="dp-dist"><label>Lejos</label><label>Cerca</label></div>
     <div class="dp-form">
     <div class="dp-titulos"><label>DP</label></div>
       <div class="dp-oslejoscerca">
         <c-form name="dp-lejos-cerca">
           <div><input name="dp-lejos" type="number" value="0"></div>
           <div><input name="dp-cerca" type="number" value="0"></div>
         </c-form>
       </div>
     </div>
   </div>
 </div>
 <label class="title">Observaciones</label>
 <textarea placeholder="Algún comentario a agregar, patologías o antecedentes. [Máximo de 255 caracteres]"
 rows="3" maxlength="255" name="observaciones"></textarea>`

 refraction_template.innerHTML = `<c-form name="Refracción" class="cs_h1rf">
      <form>
        <h1>Refracción</h1>
        <hr class="linear">
        <div class="refraction-form">
          <div class="switchbtn">
            <label>PROPIA</label>
            <div class="onoffswitch">
              <input type="checkbox" name="propia" class="onoffswitch-checkbox" id="onoff1" checked>
              <label class="onoffswitch-label" for="onoff1"></label>
            </div>
            <label>OPTICA</label>
          </div>
          ${refraction_template_string}
        <hr class="linear">
      </form>
    </c-form>`;


    var ModalView     = Backbone.View.extend({
       tagName: 'div',
       className: 'modal',
       attributes: {
         'tabindex':1,
         'style':'display:none',
       },
       initialize: function(){
           this.listenTo(app.eventBus,'confirmClient',this.renderPromptMode);
           this.listenTo(app.eventBus,'confirmMessage',this.renderMessageMode);
           this.listenTo(app.eventBus,'renderForm',this.renderPromptFormMode);
           this.listenTo(app.eventBus,'messageBox',this.renderMessageBoxMode);
           this.templatePrompt = _.template(modal_client_prompt);
           this.templatePromptForm = _.template(info_form_template);
           this.templateGenericPrompt = _.template(document.getElementById('modal-prompt-template').innerHTML);
           this.genericMessageBox = _.template($('#modal-message-template').html());
           $('body').append(this.$el);
           this._pressed = 0;
       },
       events: {
           'click button.yes-button': 'sendYes',
           'click button.no-button': 'sendNo',
           'click button.close': 'close',
           'click input[name="client"]':'radioClick',
           'click button.close': 'close',
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
       sendYes: function(event){

         if(this._value == -1){
            this._pressed = 1;
            let p = this.el.querySelector('p[name="error"]');
            p.textContent = "Si presiona 'Antiguo' es necesario seleccionar un cliente";
            p.classList.add('error-p');
            return;
          }

          if(this._action == 1){
             app.eventBus.trigger('clientResponse',[true,this._value]);
             delete this._value;
           }else if(this._action == 2){
             app.eventBus.trigger('submitToServer');
           }else if(this._action == 3){
             app.eventBus.trigger('refractionResponse',[false,0,this._method]);
             delete this._method;
           }else if(this._action >= 4 && this._action <= 6){

             let textarea = this.el.querySelector('textarea');

             if(textarea){

                if(textarea.value == ''){
                  let p = this.el.querySelector('p[name="error"]');
                  p.textContent = "Si presiona SI debe ingresar una nota con la razón";
                  p.classList.add('error-p');
                  return;
                }else{
                  switch (this._action) {
                    case 4:
                      app.eventBus.trigger('abonoConfirm',true,textarea.value);
                      break;
                    case 5:
                    case 6:
                      app.eventBus.trigger('statusChange:'+this._cid,true,textarea.value);
                      delete this._cid;
                      break;
                    default:
                  }
                }

              }else{
                event.currentTarget.parentNode.insertBefore(createElement('textarea',{'maxlength':255,'rows':3,'style':'margin:0;'}),event.currentTarget);
                event.currentTarget.parentNode.insertBefore(createElement('p',{'name':'error','textContent':`Ingresar una nota del porqué desea
                                ${ (this._action==4)?'cancelar el abono.':(this._action == 6)?"cancelar la orden.":"cambiar status a: 'Con Problemas'." }`}),
                                event.currentTarget);
                return;
              }

           }else if(this._action == 7){

             if(this._lab != undefined && !this.el.querySelector('div.lab-info')){
               let div = createElement('div',{'class':'split lab-info','style':'display:none;'});
               div.innerHTML += `<c-input
               name = "costo"
               titulo = "Costo del lente"
               pattern="^[1-9][0-9]+(\\.[0-9]{1,2})?$"
               required></c-input>
               <c-select
               titulo = "Del laboratorio"
               name = "laboratorio"
               show></c-select>`;

               let parentNode = this.el.querySelector('.modal-body');
               parentNode.insertBefore(div,parentNode.firstChild);
               app.fixedData.laboratorios.fetch().then((data)=>{
                 let csel = div.querySelector('c-select');
                 csel.options = app.fixedData.laboratorios.data;
                 div.removeAttribute('style');
                 this._pref = createElement('p',{'textContent':'Ingresar estos datos para continuar.'});
                 div.children[0].parentNode.parentNode.insertBefore(this._pref,div.children[0].parentNode.nextSibling);
                 this._isValidLab = true;
               });
               return;
             }else if(this._isValidLab && this._counter == 1){
                let childNodes = this.el.querySelector('div.lab-info').children, data = {};
                data[childNodes[0].name] = childNodes[0].value;
                data[childNodes[1].name] = childNodes[1].value;
                delete this._isValidLab;
                delete this._counter;
                delete this._pref;
                delete this._lab;
                app.eventBus.trigger('statusChange:'+this._cid,true,null,data);

                this.close();
                return;
             }else{

               let childNodes = this.el.querySelector('div.lab-info').children;
               Array.from(childNodes).forEach(item=>this._isValidLab=this._isValidLab && item.validate(),this);

               if(!this._isValidLab){
                 this._pref.textContent = 'La información es inválida, ingrese los datos nuevamente';
                 this._pref.classList.add('error-p');
                 Array.from(childNodes).forEach(item=>item.reset(),this);
                 this._counter = 0;
                 return;
               }else{
                 this._pref.textContent = 'La información es la correcta? De ser así presione SI nuevamente para guardar.';
                 this._pref.classList.remove('error-p');
                 this._counter = 1;
                 return;
               }
             }

             app.eventBus.trigger('statusChange:'+this._cid,true,);
             delete this._cid
           }
         delete this._action;
         this.close();

       },
       sendNo: function(){

         if(this._action == 1 ){
          app.eventBus.trigger('clientResponse',[true,null]);
          delete this._value;
         }
         else if (this._action == 2){
         }else if(this._action == 3){
           app.eventBus.trigger('refractionResponse',[true,1,this._method]);
           delete this._method;
         }else if(this._action >= 4){
           switch (this._action) {
             case 4:
               app.eventBus.trigger('abonoConfirm',false,null);
               break;
             case 5:
             case 6:
             case 7:
               app.eventBus.trigger('statusChange:'+this._cid,false,null);
               delete this._cid
               break;
             default:
           }
           delete this._action;
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
                        message:"Seleccione el cliente al que desea asignar la orden de las opciones de abajo, o seleccione 'Nuevo' para nuevo cliente",
                        options:models,
                        buttons:false}));
         this.$el.show();
       },
       renderPromptFormMode: function(data, names = null) {

         this._action =  2;

         this.$el.html(this.templatePromptForm({ title:'Información de la orden. Revise antes de guardar',
                                                data:data,names:(!names)?['Información del cliente','Información del aro','Información de venta']:names}));
         this.$el.show();

       },
       renderMessageMode: function(data, action = 4, cid = null) {

         if(data.hasOwnProperty('method')){
           this._action =  3;
           this._method = data.method;
           this.$el.html(this.templatePrompt({title:'Ingresar otra orden!',
                          message:"Si para este mismo cliente hay otra receta a dejar registrada en esta orden",
                          options:[],
                          buttons:true
                       }));
         }else{
           this._action = action;
           this._cid = cid;
           this._lab = data.lab;
           this.$el.html(this.templateGenericPrompt({title:data.title}));
         }
         this.$el.show();
       },
       renderMessageBoxMode: function(data, action = null){

         if(action) this._action = action;
         let html = this.genericMessageBox(data);
         this.$el.html(html);
         this.$el.show();
       },
       close: function(){
           this.$el.empty();
           this.$el.hide();
       }
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

/*  El template de info es fijo */
  var OrdenItemView = TemplateView.extend({
    events:{
      'change select[name="pagado"]':'cambioPagado',
      'change select[name="status"]':'cambioStatus',
      'click button[name="cliente"]':'renderCliente',
      'click button[name="orden"]':'renderOrden',
      'click button.print-button-table':'renderPDF'
    },
    tagName:"tr",
    initialize: function(){
      this.template =_.template(`<td><%= this.model.type %></td><td><button class="btn-table-orden"  name="orden"><%= this.model.get('id') %></button></td>
        <td><%- this.model.get('fecha') %></td>
        <td><button class="btn-table-orden" name="cliente"><%= this.model.get('cliente').firstname + " " +this.model.get('cliente').lastname  %></button></td>
        <td><select name="status">
              <option value="0"> Pendiente</option>
              <option value="1"> Listo</option>
              <option value="2"> Entregado</option>
              <option value="3"> Con Problemas </option>
              <option value="4"> Cancelado </option>
        </select></td>
        <td><select name="pagado">
              <option value="0"> Sin abonar</option>
              <option value="1"> Abonado</option>
              <option value="2"> Pagado </option>
        </select></td><td><%= this.model.get('total') %></td><td><%= this.model.get('abono') %></td>
        <td><button class="print-button-table fa fa-print" name="abonos"></button></td>`);
      this.el.innerHTML = this.template(this);
      this._formRef = document.querySelector('div.form-render-container');
      this._statusRef = this.el.querySelector("select[name='status']");
      this._payRef = this.el.querySelector("select[name='pagado']");
      this._payRef.value = this.model.get('pagado');
      this._statusRef.value = this.model.get('status');
      this.listenTo(app.eventBus,'statusChange:'+this.model.get('id'),this._changeStatus);
      setSelectColor(this._statusRef);
      setSelectColor(this._payRef,false);
    },
    clienteTemplate: function(){

    },
    renderCliente:function(){
      app.eventBus.trigger('clientClick', this.model.get('cliente').uri);
    },
    renderOrden:function(){
      app.eventBus.trigger('ordenInfoClick',this.model.get('uri'));
    },
    cambioPagado: function(event){
      app.eventBus.trigger('confirmMessage',{'title':`Esta seguro que desea cambiar de A a B`},5);
    },
    cambioStatus: function(event){
      let oldval = this.model.get('status'), newval = Number(event.currentTarget.value);
      if(oldval == 2 || oldval == 4){
        app.eventBus.trigger('messageBox',{'title':'Imposible volver a este estado',
                              'message':[`El estado ${statusText(oldval)} es final, para cambiarlo cambiarlo debe contactar al administrador.`],
                              'extra':"",'id':this.model.get('id')});
      }

      if(newval == 0){
        app.eventBus.trigger('messageBox',{'title':'Imposible volver a este estado',
                              'message':[`No puede regresar una orden con status: '${statusText(oldval)}' a orden con status: '${statusText(newval)}'`],
                              'extra':"",'id':this.model.get('id')});
        this._statusRef.value = oldval;
      }

      if(newval == 1 && (oldval == 3 || oldval == 0)){
        if(oldval == 0 && (this.model.type == 'C' || this.model.type == 'L'))
          app.eventBus.trigger('confirmMessage',{
            'title':`Esta seguro que desea cambiar de '${statusText(this.model.get('status'))}' a '${statusText(event.currentTarget.value)}'.`,'lab':true},7,this.model.get('id'));
        else
        app.eventBus.trigger('confirmMessage',{
          'title':`Esta seguro que desea cambiar de '${statusText(this.model.get('status'))}' a '${statusText(event.currentTarget.value)}'.`},7,this.model.get('id'));
      }

      if(newval == 3 && (oldval == 0 || oldval == 1)){
        app.eventBus.trigger('confirmMessage',{
          'title':`Esta seguro que desea cambiar de '${statusText(this.model.get('status'))}' a '${statusText(event.currentTarget.value)}'.`},5,this.model.get('id'));
      }

      if(newval == 2 && oldval == 1){
        app.eventBus.trigger('confirmMessage',{
          'title':`Esta seguro que desea cambiar de '${statusText(this.model.get('status'))}' a '${statusText(event.currentTarget.value)}'.`},7,this.model.get('id'));
      }else if (newval == 2 && oldval != 1){
        app.eventBus.trigger('messageBox',{'title':'Cambie el estado a listo antes de continuar',
                              'message':[`No puede pasar una orden con status: '${statusText(oldval)}' a orden con status: '${statusText(newval)}'`],
                              'extra':"",'id':this.model.get('id')});
      }

      if((newval == 4 && oldval != 2)){
        app.eventBus.trigger('confirmMessage',{
          'title':`Esta seguro que desea cambiar de '${statusText(this.model.get('status'))}' a '${statusText(event.currentTarget.value)}'.`},6,this.model.get('id'));
      }

      this._statusNew = newval;
      this._statusRef.value = oldval;

    },
    _changeStatus: function(change,reason,lab = {}){

      if(!change){
        this._statusRef.value = this.model.get('status');
        setSelectColor(this._statusRef);
        return;
      }

      if(!_.isEmpty(lab) && (this.model.type == 'C' || this.model.type =='L')){

        app.opxhr(this.model.get('uri'),'PATCH',JSON.stringify({'status':1,'lente':lab}))
        .then(()=>{
          this._statusRef.value = this._statusNew;
          this.model.set('laboratorio',app.fixedData.laboratorios.data.get(lab.laboratorio));
          this.model.set('costolente',lab.costolente);
          setSelectColor(this._statusRef);
          this.model.set('status',this._statusNew);
          delete this._statusNew;
        }).catch((error)=>{
          alert(error);
        });
        return;
      }

      app.opxhr(this.model.get('uri'),'PATCH',JSON.stringify({'status':this._statusNew,'notas':reason}))
      .then(()=>{
        this._statusRef.value = this._statusNew;
        setSelectColor(this._statusRef);
        this.model.set('status',this._statusNew);
        delete this._statusNew;
      });

    },
    renderPDF: function(){
      console.log(this);
      app.opxhr(this.model.get('uri')+"print_pdf/",'GET',{},true).then((data)=>{
        let newWindow = window.open('/');

        newWindow.onload = () => {
            newWindow.location = URL.createObjectURL(data);
        };

      });
    },
  });

  var ControlWindow = TemplateView.extend({
    events:{
      'click button.square-checkbox-btn':'renderRefractionForm',
      'click #form-render-ecancel-btn':'stopFormEdit',
      'click #form-render-edit-btn':'allowFormEdit',
      'submit #client-refraction':'submitRefraction',
      'submit #form-render-submit-btn':'submitCliente',
      'click #new-abono':'renderAbonoForm',
      'click button.close':'resetWindow',
      'click #efectivo':'pickChange',
      'click input[type="radio"]:not(#efectivo)':'closeChange',
      'click #abono-cancel':'closeAbono',
      'click #abono-save':'saveAbono',
      'click button[name="delete-abono"]':'confirmDeleteAbono',
    },
    className: 'form-render-container',
    tagName: 'div',
    initialize: function(options){
      options._contentElement.appendChild(this.el);
      this.abonoFormTemplate = _.template(abono_form_template);
      this.listenTo(app.eventBus,'abonoConfirm',this.deleteAbono);
    },
    pickChange: function(event){

      event.currentTarget.parentNode.parentNode.removeAttribute('ttip');

      if(this._calculatorDiv) return;

      let parentElement = this.el.querySelector('#abono-orden-form .ordenes-static-info'),
          div = createCashDiv(this.el.querySelector('c-input[name="payment"]'));
      parentElement.insertBefore(div,parentElement.querySelectorAll(':scope > div')[1]);
      this._calculatorDiv = div;

    },
    closeChange: function(event){

      event.currentTarget.parentNode.parentNode.removeAttribute('ttip');

      if(this._calculatorDiv){
        this._calculatorDiv.remove();
        delete this._calculatorDiv;
      }

    },
    render: function(){
      if(this.el.getAttribute('style'))
        this.el.classList.remove('down-transition');
      else
        this.el.classList.add('down-transition');
    },
    resetWindow: function(){

      if(this._refractionIndex){
        delete this._refractionIndex;
        this.cleanRefraction(document.getElementById('client-refraction'));
      }

      while(this.el.firstChild) this.el.firstChild.remove();
      this.el.classList.remove('down-transition');
      this.el.parentNode.querySelector('c-table').classList.remove('ordenes-hidden');

    },
    stopFormEdit:function(event){

      let cinputs = this.el.querySelector('c-form').querySelectorAll('c-input');
      cinputs.forEach((item)=>{
        if(this.model.attributes.hasOwnProperty(item.name))
          item.value = this.model.get(item.name);

        item.disabled = true;

      });
      event.currentTarget.setAttribute('style','display:none');
      document.getElementById('form-render-submit-btn').setAttribute('style','display:none');
      document.getElementById('form-render-edit-btn').removeAttribute('style');

    },
    allowFormEdit: function(event){

      event.currentTarget.setAttribute('style','display:none;');
      let cinputs = this.el.querySelector('c-form').querySelectorAll('c-input');
      document.getElementById('form-render-ecancel-btn').removeAttribute('style');
      document.getElementById('form-render-submit-btn').removeAttribute('style');
      cinputs.forEach((item)=>item.disabled = false);

    },
    cleanRefraction(element){

      let ejes = element.parentNode.querySelectorAll('input[name="eje"]'),
      cilindros = element.parentNode.querySelectorAll('input[name="cilindro"]'),
      esferas = element.parentNode.querySelectorAll('input[name="esfera"]');

      ejes.forEach((item)=>{item.removeEventListener('blur',_ejeValidation);});
      cilindros.forEach((item)=>{item.removeEventListener('blur',_cilindroValidation);});
      esferas.forEach((item)=>{item.removeEventListener('blur',_esferaValidation);});

    },
    renderRefractionForm: function(event){

      if(event.currentTarget.classList.contains('active')){

        document.getElementById('client-refraction').parentNode.childNodes[1].removeAttribute('style');
        event.currentTarget.parentNode.parentNode.classList.remove('refraction-wrapper');
        event.currentTarget.parentNode.classList.remove('selected');
        event.currentTarget.removeAttribute('ttip');
        event.currentTarget.removeAttribute('ttip-position');
        event.currentTarget.classList.remove('active');
        let div = event.currentTarget.parentNode.querySelector('div:not(.obs-box)');
        div.removeAttribute('style');

        this.cleanRefraction(event.currentTarget);

        while(div.firstChild) div.firstChild.remove();
        delete this._refractionIndex;
        return;
      }

      document.getElementById('client-refraction').parentNode.childNodes[1].setAttribute('style','display:none');
      event.currentTarget.classList.add('active');
      event.currentTarget.setAttribute("ttip","Click aca para volver");
      event.currentTarget.setAttribute("ttip-position","right");
      event.currentTarget.parentNode.parentNode.classList.add('refraction-wrapper');
      event.currentTarget.parentNode.classList.add('selected');

      let url = "/api/v1/refraction/"+event.currentTarget.parentNode.getAttribute('index'),
          div = event.currentTarget.parentNode.querySelector('div:not(.obs-box)');

      this._refractionIndex = event.currentTarget.parentNode.getAttribute('index');

      app.opxhr(url,'GET',{}).then((data)=>{
        div.innerHTML = refraction_template_string;
        div.innerHTML += `<button type="submit"> Guardar <span class="fab fa-telegram-plane"></span></button>`
        document.getElementById('client-refraction').serializeForm = receta;
        div.setAttribute('style','padding:10px 25px 25px; border-top: 1px solid #c6c6c6;')
        let ejes = div.querySelectorAll('input[name="eje"]'),
        cilindros = div.querySelectorAll('input[name="cilindro"]'),
        esferas = div.querySelectorAll('input[name="esfera"]');
        ejes.forEach((item)=>{item.addEventListener('blur',_ejeValidation);});
        cilindros.forEach((item)=>{item.addEventListener('blur',_cilindroValidation);});
        esferas.forEach((item)=>{item.addEventListener('blur',_esferaValidation);});

        let refraction = JSON.parse(data);

        Object.keys(refraction).forEach(function(item){

          if(item=='observaciones')
            div.querySelector('textarea').value = refraction[item];

          let subform = div.querySelector(`c-form[name="${item}"]`);

          if(Object.prototype.toString.call(refraction[item]) === '[object Object]')

            Object.keys(refraction[item]).forEach(function(subitem){
              let subelement = null;
              switch (subitem) {
                case 'base':
                  subelement = subform.querySelector(`select[name="${subitem}"]`);
                  subelement.selectedIndex = refraction[item][subitem];
                  break;
                default:
                  subelement = subform.querySelector(`input[name="${subitem}"]`);
                  subelement.value = refraction[item][subitem];
              }

            });
        });

      });
    },
    submitRefraction: function(event){

      event.preventDefault();
      let body = event.currentTarget.serializeForm(false),
          cform = event.currentTarget,
          div = event.currentTarget.querySelector('div.refraction.selected > div:not(.obs-box)')
          url = "/api/v1/refraction/" + this._refractionIndex;

      app.opxhr(url,'PUT',JSON.stringify(body)).then((data)=>{
        cform.parentNode.childNodes[1].removeAttribute('style');
        cform.parentNode.childNodes[1].setAttribute('style','border-bottom:1px solid black;');
        cform.querySelector('form').classList.remove('refraction-wrapper');
        cform.querySelector('div.refraction.selected').classList.remove('selected');
        cform.querySelector('button.active').classList.remove('active');
        div.removeAttribute('style');

        this.cleanRefraction(cform);

        while(div.firstChild) div.firstChild.remove();
        let modelTMP = this.model.get('refractions').find((item)=>item.id==Number(this._refractionIndex));

        app.eventBus.trigger('messageBox',{'title':'Receta actualizada',
                              'message':[`La receta del cliente ${this.model.get('firstname')} ${this.model.get('lastname')} de fecha ${modelTMP.fecha} fue actualizada correctamente`],
                              'extra':""});
        modelTMP.observaciones = JSON.parse(data).obs;
        cform.querySelector('.obs-box > label').textContent = JSON.parse(data).obs;

        delete this._refractionIndex;
        return;

      }).catch((exception)=>{
        console.log(exception);
      });

    },
    renderAbonoForm: function(event){
      let ordenForm = this.el.querySelector('#orden-form'),
          abonoForm = this.el.querySelector('#abono-orden-form');
      abonoForm.innerHTML = this.abonoFormTemplate({model:this.model});
      ordenForm.classList.add('slide-transition');
      setTimeout(()=>{
        ordenForm.classList.remove('slide-transition');
        ordenForm.setAttribute('style','display:none');
        abonoForm.removeAttribute('style');
        abonoForm.classList.add('selected');
      },500);
      console.log(this.model);
      this.el.querySelector('#sinabono').remove();
      this.el.querySelector('label[for="sinabono"]').remove();

      let cinp = this.el.querySelector('c-input[name="payment"]'),
          saldo = (Number(this.model.get('total'))-Number(this.model.get('abonado'))).toFixed(2),
          radios = this.el.querySelectorAll('input[name="payform"]'),
          self = this;

      cinp._extraValidationStep = function(){

        let selected = Array.prototype.find.call(radios, (child)=> child.checked);

        if (selected === undefined){
          radios[0].parentNode.parentNode.setAttribute('ttip','Debe de seleccionar una opción.');
          return false;
        }
        else
          selected.parentNode.parentNode.removeAttribute('ttip');

        if(Number(this.value) > saldo){
          this.setToolTip("El valor a abonar no puede ser mayor al saldo pendiente");
          return false;
        }

        if(self.el.querySelector('c-input[name="recibida"]')!=null){

          let inp = self.el.querySelector('c-input[name="recibida"]');

          if(inp.value=='') return true;

          if (Number(inp.value) < Number(this.value)){
            inp.setToolTip("La cantidad recibida debe superar o ser igual a la cantidad a abonar");
            return false;
          }

          self.el.querySelector('label[name="change"]').textContent = (Number(inp.value) - Number(this.value)).toFixed(2);

        }

        return true;

      }

      this.el.querySelector('c-input[tipo="date"]')._extraValidationStep = function(){

        if(isNaN(this.value)) return true;

        let date = new Date(this.value);
        if(!this._today) this._today = new Date();

        if(date.getUTCFullYear() != this._today.getUTCFullYear()){
          this.setToolTip('Ingrese una fecha válida');
          return false;
        }

        if((date.getUTCMonth() == this._today.getUTCMonth() - 1) || (date.getUTCMonth() == this._today.getUTCMonth())){
          if(date.getUTCMonth() == this._today.getUTCMonth())
            if(date.getUTCDate() < this._today.getUTCDate())
              return true;
            else {
                this.setToolTip('No se pueden registrar fechas futuras');
            }
          else
            return true;
        }else{
          this.setToolTip('No se permite registrar un abono con más de 1 mes de antigüedad.');
          return false;
        }

      }

    },
    closeAbono: function(){

      let ordenForm = this.el.querySelector('#orden-form'),
          abonoForm = this.el.querySelector('#abono-orden-form');
      abonoForm.classList.remove('selected');
      abonoForm.classList.add('slide-transition');
      setTimeout(()=>{
        abonoForm.classList.remove('slide-transition');
        abonoForm.setAttribute('style','display:none');
        while(abonoForm.firstChild) abonoForm.firstChild.remove();
        ordenForm.removeAttribute('style');
        ordenForm.classList.add('selected');
      },500);

    },
    saveAbono: function(event){

      event.preventDefault();

      let abonoForm = this.el.querySelector('#abono-orden-form'),
          data = abonoForm.serializeForm();

      if(!abonoForm.validate())
        return;

      if(isNaN(data.fecha))
        delete data.fecha;

      app.opxhr(this.model.get('url')+"save_abono/",'POST',JSON.stringify(data)).then((data)=>{
        /*
        1. update pagado x
        2. update model  x
        3. update saldo
        4. update ui
        5. update OrdenItemView
        */
        let datos = JSON.parse(data), abonos = this.el.querySelector('div.abono-info'),
            div = createElement('div',{});

        div.innerHTML = `<label>${datos.info}</label>
                          <button class="rounded-btn" name="delete-abono" value="${datos.id}" type="button">
                            <i class="fa fa-trash"></i>
                          </button>`;
        abonos.appendChild(div);
        this.model.set('pagado',datos.pagado);
        this.model.set('abonado',datos.abonado);
        this.closeAbono();
      });

    },
    confirmDeleteAbono: function(event){
      let value = event.currentTarget.getAttribute('value');
      this._abonoValue = value;
      app.eventBus.trigger('confirmMessage',{title:'Está seguro que desea eliminar el abono?!'});
    },
    deleteAbono: function(confirm,val){

      if(confirm){
        app.opxhr(this.model.get('url') + 'save_abono/','DELETE',JSON.stringify({id:this._abonoValue,nota:val})).then((data)=>{
          let datos = JSON.parse(data),
              btn = this.el.querySelector(`button[value="${datos.id}"]`);
          btn.parentNode.insertBefore(createElement('span',{'class':'cancelado fa fa-times'}),btn);
          btn.remove();
        });
      }

      delete this._abonoValue;

    },
  });


  var TableView = TemplateView.extend({
    tagName: "c-table",
    className: 'ordenes selected',
    initialize: function(options){
      this.ControlView = new ControlWindow({_contentElement: options._contentElement});
      this.optionFormContainer = options._contentElement.querySelector('div.form-render-container');
      this.optionFormContainer.appendChild(createElement('button',{'class':'close','textContent':'X'}));
      this.el.setAttr([3,10.5,13.5,18,15,15,10,10,5], ['','No.Orden','Fecha','Cliente','Estado','Pago','Total','Abonos','Print']);
      this.el.collection = this.collection;
      this.subViews = [];
      this.el._cform.collection = this.collection;
      this.el._cform.submit = function(event){
          event.preventDefault();
          let data = this.serializeForm(true);
          this._collection.fetch({
            data: data
          });
        }
      this.collection.fetch();
      this.extras();
      this.listenTo(app.eventBus,'clientClick',this.renderClientInfo);
      this.listenTo(app.eventBus,'ordenInfoClick',this.renderOrdenInfo);
      this.listenTo(this.collection,'update',this._reRenderTable);
      this.clientTemplate = _.template(`<c-form style="border-bottom:1px solid black;">
                              <form style="padding:25px;">
                              <h2>Información del cliente</h2>
                              <hr class="linear">
                              <div>
                                <div class="split">
                                  <div class="split">
                                    <c-input
                                    titulo = "Nombre del cliente"
                                    name = "firstname"
                                    pattern = "^[A-Za-záéíñóúüÁÉÍÑÓÚÜ\\s]+$"
                                    value = "<%= model.get('firstname') %>"
                                    required
                                    disabled
                                    ></c-input>
                                    <c-input
                                    titulo  = "Apellido del cliente"
                                    name = "lastname"
                                    value = "<%= model.get('lastname') %>"
                                    required
                                    disabled
                                    pattern = "^[A-Za-záéíñóúüÁÉÍÑÓÚÜ\\s]+$"></c-input>
                                  </div>
                                  <div class="split information">
                                    <c-input
                                    titulo = "Ocupación"
                                    name = "ocupacion"
                                    value = "<%= model.get('ocupacion') %>"
                                    pattern = "^[A-Za-záéíñóúüÁÉÍÑÓÚÜ\\s]+$"
                                    disabled
                                    ></c-input>
                                    <div class="information" style="padding-top:5vh;">
                                      <button type="button" id="form-render-edit-btn">Editar  <span class="fa fa-edit"></span></button>
                                    </div>
                                  </div>
                                </div>
                                  <div class="split">
                                    <div class="split">
                                      <c-input
                                      titulo = "Número de contacto"
                                      name = "contact_1"
                                      value = "<%= model.get('contact_1')%>"
                                      required
                                      pattern = "^[0-9]{8,8}$"
                                      disabled
                                      ></c-input>
                                      <c-input
                                      name = "contact_2"
                                      titulo = "Número de contacto"
                                      pattern = "^[0-9]{8,8}$"
                                      value = "<%= model.get('contact_2') %>"
                                      disabled
                                      ></c-input>
                                    </div>
                                    <div class="information" style="padding:5vh 0 0 1vh;">
                                      <button type="submit" style="display:none" id="form-render-submit-btn">Guardar cambios <span class="fab fa-telegram-plane"></span></button>
                                      <button type="button" id="form-render-ecancel-btn" style="display:none;">Cancelar <span class="fa fa-times"></span></button>
                                    </div>
                                  </div>
                              </div>
                              </form></c-form>
                              <c-form id="client-refraction">
                                <h2>recetas oftalmológicas</h2>
                                <hr class="linear">
                                <form>
                                    <% model.get('refractions').forEach( function(item){ %>
                                        <div class="refraction" index="<%= item.id %>">
                                          <button class="square-checkbox-btn" type="button"></button>
                                          <label class="title">Fecha:</label>
                                          <label><%= item.fecha %></label>
                                          <label class="title">Origen:</label>
                                          <label><%= (item.propia)?"Optica":"Paciente" %></label>
                                          <label class="title">Observaciones:</label>
                                          <div class="obs-box">
                                            <label><%= (item.obs=="")?'-':item.obs %></label>
                                          </div>
                                          <div></div>
                                        </div>
                                    <% }); %>
                                <form>
                              </c-form>`);
      this.orderTemplate = _.template(options.orderTemplate);
      let cselstatus = createElement('c-select',{'name':'status','title':'Status:'},true),
          cselpagado = createElement('c-select',{'name':'pagado','title':'Pagos:'},true);

      cselstatus.options = new Map([[-1,'Por status'],[0,'Pendiente'],[1,'Listo'],[2,'Entregado'],[3,'Con Problemas'],[4,'Cancelado']])
      cselpagado.options = new Map([[-1,'Por pagos'],[0,'Sin Abonar'],[1,'Abonado'],[2,'Pagado']])

      this.el.getFilters().appendChild(cselstatus)
      this.el.getFilters().appendChild(cselpagado)

      cselstatus.listeners = function(){

        setSelectColor(cselstatus._csel,false);
        let data = this.serializeForm();
        console.log(data);
        this.collection.fetch({
          data: data
        });
      }.bind(this.el._cform);

      cselpagado.listeners = function(){

        setSelectColor(cselpagado._csel,false);
        let data = this.serializeForm();
        this.collection.fetch({
          data: data
        });

      }.bind(this.el._cform);

      options._contentElement.appendChild(this.el);
    },
    extras: function(){

      let cdpfin = createElement('c-datepicker',
                                {title : 'Menor a:',name: 'last_date'},true),
          cdpini = createElement('c-datepicker',
                              {title : 'Mayor a:',name: 'ini_date'},true),

          fnCallback = function(){

            let data = this.serializeForm();

            this._collection.fetch({
              data: data
            });

          }.bind(this.el._cform);

      this.el.getFilters().appendChild(cdpini);
      this.el.getFilters().appendChild(cdpfin);
      cdpini.callback = fnCallback;
      cdpfin.callback = fnCallback;
      this.el.createFilterControl();
    },
    renderClientInfo: function(url){
      this.el.classList.add('ordenes-hidden');
      this.ControlView.render();
      app.opxhr(url,'GET',{}).then((response,status,xhttp)=>{
        this.currClient = new app.models.Cliente(JSON.parse(response));
        this.optionFormContainer.innerHTML = this.clientTemplate({model:this.currClient});
        this.optionFormContainer.insertBefore(createElement('button',{'textContent':'x','class':'close'}),this.optionFormContainer.firstChild)
        this.ControlView.model = this.currClient;
        this.ControlView.form  = 'client';
      });
    },
    renderOrdenInfo: function(url){
      this.el.classList.add('ordenes-hidden');
      this.ControlView.render();

      app.opxhr(url,'GET',{}).then((response,status,xhttp)=>{
        this.currOrden = new app.models.OrdenCompleta(JSON.parse(response));
        this.optionFormContainer.innerHTML = this.orderTemplate({model:this.currOrden});
        this.optionFormContainer.insertBefore(createElement('button',{'textContent':'x','class':'close'}),this.optionFormContainer.firstChild)
        this.ControlView.model = this.currOrden;
        this.ControlView.model.set('url',url);
        this.ControlView.form  = 'orden';
      });

    },
    _reRenderTable: function(){

      this.subViews.forEach(function(element){
        element.destroy_view();
      });

      this.subViews.length = 0;
      /*  eliminamos posibles elementos que aún están en el cuerpo  */
      while (this.el.getTBody().hasChildNodes())
        this.el.getTBody().removeChild(this.el.getTBody().lastChild);

      this._renderTable();
    },
    _renderTable: function(){

      this.collection.models.forEach(function(model,index){
        this.subViews.push(new OrdenItemView({
          model: model,
        }));

        this.el.createFooter();
        this.el.renderFooter();
      },this);

      this._renderSubViews();
    },
    _renderSubViews: function(){

      _(this.subViews).each(function( view ){
          view.render();
          this.el.getTBody().append(view.el);
        },this);

      if(!this.subViews.length)
        this.el.renderEmptyTable();

      this.el.renderFooter(this);
    },
  });

  app.tmp = TableView;

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
      if(this.extraSections)
        this.extraSections();
      this.el.querySelectorAll('section > c-form:first-child')
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

      this.listenTo(app.eventBus,'submitToServer',this.submitToServer);

      let self = this;

      this._formList[0].submit = function(fun = null, event = null){

          let formdata = this.serializeForm(),
              data = Object.assign({}, formdata);

          if(Object.keys(self._formData[0]).length > 0 && _.isEqual(self._formData[0],data) ){
              self._checkforclient = true;
              if(!fun)
                self.goToNextSection();
              else if(fun!=null && event!=null)
                self[fun](event);
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
                  self._clientModel = self._clientModel.get('id');
                  self._checkforclient = true;
                  if(!fun)
                    self.goToNextSection();
                  else if(fun!=null && event!=null)
                    self[fun](event);
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

      let cinput = this.el.querySelector('c-form[name="Aro"] c-input[name="costo"]'),
          cselect = this.el.querySelector('c-select[name="inventario"]'),
          cdate   = this.el.querySelector('c-input[name="entrega"]');


      cinput._extraValidationStep = function(){

        if(cselect.value == '0' || cselect.value == ''){

            this.setToolTip('Seleccione un aro antes y luego ingrese el total de la orden');
            this.value = ''
            return false;

        } else {

            let base_cost = app.fixedData.inventario_aros.data.get(Number(cselect.value))[1];

            if(base_cost > Number(this.value)){
              this.setToolTip(`El costo del lente debe ser mayor a Q.${base_cost}`);
              this.value = '';
              return false;
            }
        }

          return true;
      }

      cdate._today = new Date();
      cdate._extraValidationStep = function(){

        this._tmpDate = new Date(this.value);
        let returnVal = true;

        if( this._tmpDate.getUTCFullYear() < this._today.getUTCFullYear() ){
          this.setToolTip('Debe seleccionar una fecha válida de entrega');
          returnVal = false;
        }
        if( this._tmpDate.getUTCFullYear() == this._today.getUTCFullYear() && this._tmpDate.getUTCMonth() < this._today.getUTCMonth()){
          this.setToolTip('Debe seleccionar una fecha válida de entrega');
          returnVal = false;
        }

        if(this._tmpDate.getUTCMonth() == this._today.getUTCMonth() && this._tmpDate.getUTCDate() < this._today.getUTCDate() ){
          this.setToolTip('Debe seleccionar una fecha válida de entrega');
          returnVal = false;
        }

        if( this._tmpDate.getHours() < 9 || this._tmpDate.getHours() > 18){
          this.setToolTip('Debe seleccionar un horario válido de entrega');
          returnVal = false;
        }

        delete this._tmpDate;
        return returnVal;

      }

    },
    closeOrden: function () {

      let currentForm = this._formList[this._current];
      currentForm.parentNode.classList.add('slide-transition');
      currentForm.parentNode.classList.remove('selected');

      setTimeout(this.destroy_view.bind(this),500);

    },
    _renderButtons:function(){

      let div = this.el.querySelector('div.left-sidebar div');

      div.innerHTML = (this._formList.map((form,index)=>
              `<button class="${(!index)?"active ":""}left-menu-btn" ttip=${form.getAttribute('name')}
               ttip-position="left" value="${index}" ${(!index)?"":'disabled'}></button>`).join(''));
    },
    renderLastSection: function(currentForm, currentButton){
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
      },500);

      this._current = this._current - 1;

      if(this._current == 0){ this._backBtn.setAttribute('style','display:none'); this._checkforclient = false; }

    },
    renderNextSection:function(currentForm, currentButton){

      let nextForm = this._formList[this._current + 1],
          nextButton = this.el.querySelector(`button[ttip=${nextForm.getAttribute('name')}]`);

      currentButton.classList.remove('active');
      nextButton.classList.add('active');
      nextButton.removeAttribute('disabled');
      currentForm.parentNode.classList.add('slide-transition');
      currentForm.parentNode.classList.remove('selected');

      setTimeout(()=>{
        currentForm.parentNode.removeAttribute('class');
        nextForm.parentNode.setAttribute('class','selected');
        this._backBtn.removeAttribute('style');
      },500);


      this.saveFormData(currentForm);

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
            if(this.value > costo){
                this.setToolTip('El descuento no puede superar al costo de venta');
                return false;
            }

            label.textContent = (costo - this.value).toFixed(2);

          }

          return true;
        }// fin extra validate

      }//fin de revisar el máximo
    },
    saveFormData: function(currentForm){
      _.extend(this._formData[this._current],currentForm.serializeForm());
    },
    goToNextSection:function(){

      let currentForm = this._formList[this._current],
          currentButton = this.el.querySelector(`button[ttip="${currentForm.getAttribute('name')}"]`);

      if(this._current >= this._max) return;


      if(currentForm.validate()){

        if(this._current == 0 && currentForm.getAttribute('name')=='Cliente' && !this._checkforclient){
          currentForm.submit();  return;
        }

        this.renderNextSection(currentForm, currentButton);

      }// fin del validate

    },
    goToLastSection: function(){

      if(this._current <= 0) return;

      let currentForm = this._formList[this._current],
          currentButton = this.el.querySelector(`button[ttip="${currentForm.getAttribute('name')}"]`);

      if(currentForm.validate()){
        this.renderLastSection(currentForm,currentButton);
      }
    },
    renderChangeSection(clickedButton,currentButton,currentForm,wantedForm){

      currentButton.classList.remove('active');
      clickedButton.classList.add('active');
      currentForm.parentNode.classList.add('slide-transition');
      currentForm.parentNode.classList.remove('selected');

      this.saveFormData(currentForm);

      setTimeout(()=>{
        currentForm.parentNode.removeAttribute('class');
        wantedForm.parentNode.setAttribute('class','selected');
      },500);

      this._current = Number(clickedButton.getAttribute('value'));

      if(this._current == 0){ this._backBtn.setAttribute('style','display:none'); this._checkforclient = false; }
      else this._backBtn.removeAttribute('style');
      if(this._current == this._formList.length-1 ) this._nextBtn.setAttribute('style','display:none');
      else this._nextBtn.removeAttribute('style');

    },
    changeSection: function(event){

      let clickedButton = event.currentTarget,
          currentButton = this.el.querySelector('button.left-menu-btn.active'),
          currentForm   = this.el.querySelector(`c-form[name=${currentButton.getAttribute('ttip')}]`),
          wantedForm    = this.el.querySelector(`c-form[name=${clickedButton.getAttribute('ttip')}]`);

      if (clickedButton === currentButton) return;

      if(currentForm.validate()){

        if(this._current == 0 && currentForm.getAttribute('name')=='Cliente' && !this._checkforclient){
          currentForm.submit('changeSection',event);  return;
        }

        this.renderChangeSection(clickedButton,currentButton,currentForm,wantedForm);
      }

    },
    render:function(){
      this._contentElement.appendChild(this.el);
    }
  });

  var OrdenAroView = GenericOrdenView.extend({
    events: function(){
        return _.extend(GenericOrdenView.prototype.events,{'submit c-form':'submit',
                          'click #efectivo':'changePicked',
                          'click input[type="radio"]:not(#efectivo)':'deleteChange',
                        });
    },
    className: 'section-list',
    template:`<section class = "selected"><c-form name="Cliente"><form>
              <h1>Datos del cliente</h1>
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
            <form>
              <h1>Elección del aro</h1>
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
              pattern = "^[1-9][0-9]+(\\.[0-9]{1,2})?"
              ></c-input><% if(!app.session.get('sucursal')){ %></div><% } %>
              <label class='title'>Observaciones:</label>
              <textarea placeholder="Algún comentario a agregar o si al aro se le da una venta adicional [Máximo de 255 caracteres]"
              rows="3" maxlength="255" name="observaciones"></textarea>
              <hr class="linear" />
        </form></c-form></section>`,
      fillCollections: function(){

          let arocsel = this.el.querySelector('c-select[name="inventario"]'),
              marcacsel = this.el.querySelector('c-select[name="marca"]'),
              input = this.el.querySelector('c-form[name="Aro"] c-input[name="costo"]');
              self = this;


          if(!app.session.get('sucursal')){

            let opticaCsel = this.el.querySelector('c-select[name="optica"]');

            app.fixedData.opticas.fetch().then(function(){
                opticaCsel.options = app.fixedData.opticas.data;
            });

            opticaCsel.listeners = function() {

              let value = this.value;

              if(value == "0"){ marcacsel.clear(); arocsel.clear(); input.reset(); input.value = ''; return; }

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

            if(this.value == "0"){ arocsel.clear(); input.reset(); input.value = ''; return; }

            request = app.fixedData.inventario_aros.fetch({optica:self._opticaID,orden:true,marca:this.value});

            request.then(function(){
              arocsel.options = app.fixedData.inventario_aros.data;
              input.reset(); input.value = '';
            });

          }.bind(marcacsel)

          arocsel.listeners = function(){
            if(this.value == "0"){ input.reset(); input.value = ''; return;}
          }
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


        if(selected.value != 0 && !abono.value){
          abono.setToolTip('Debe ingresar la cantidad a abonar');
          return;
        }else if(selected.value != 0 && abono.value && Number(abono.value) > Number(total)){
          abono.setToolTip('La cantidad a abonar no puede superar el total de la orden');
          return;
        }else if(selected.value == 0 && abono.value){
          abono.setToolTip('Si selecciona la opción sin abono deje en blanco este campo');
          return;
        }else{
          abono.setToolTip();
          abono.iconChange(1);
        }

        _.extend(this._formData[this._max],this._formList[this._max].serializeForm(),{'total':total});
        this._formData[this._max].payform = selected.value;
        if(this._formData[this._max].hasOwnProperty('recibida'))
          delete this._formData[this._max]['recibida'];

        app.eventBus.trigger('renderForm', parseFormData(this._formData));

      },
      submitToServer:function() {

        let data = {};

        data.cliente = this._formData[0];
        this._clientModel && (data.cliente.id = this._clientModel);
        data.inventario = this._formData[1].inventario;
        data.observaciones = this._formData[1].observaciones;
        _.extend(data,this._formData[2]);

        $.ajax({
          url: app.urls.ordenaro,
          method: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(data),
          success: function(succ){
            console.log(succ);
            alert('success');
          },
          error: function(error){
            console.log(error);
            alert('error');
          }
        });
      },
      changePicked: function(event){

        event.currentTarget.removeAttribute('ttip');

        if(this._calculatorDiv) return;

        let parentElement = this.el.querySelector('c-form[name="Pago"] > form'),
            div = createCashDiv(this.el.querySelector('c-input[name="payment"]'));
        parentElement.insertBefore(div,parentElement.querySelectorAll(':scope > div')[2]);
        this._calculatorDiv = div;
      },
      deleteChange: function(event){

        event.currentTarget.parentNode.parentNode.removeAttribute('ttip');

        if(this._calculatorDiv){
          this._calculatorDiv.remove();
          delete this._calculatorDiv;
        }
      },
  });


  var OrdenCompletaView = OrdenAroView.extend({
    initialize: function(options) {
      OrdenAroView.prototype.initialize.apply(this,arguments);
      let refractionSelector = this._formList[1],
          ejes = refractionSelector.querySelectorAll('input[name="eje"]'),
          cilindros = refractionSelector.querySelectorAll('input[name="cilindro"]'),
          esferas = refractionSelector.querySelectorAll('input[name="esfera"]'),
          self = this;

      ejes.forEach((item)=>{item.addEventListener('blur',_ejeValidation);});
      cilindros.forEach((item)=>{item.addEventListener('blur',_cilindroValidation);});
      esferas.forEach((item)=>{item.addEventListener('blur',_esferaValidation);});

      refractionSelector.validate = function(){

        let isValid = true;
        ejes.forEach((item)=>{ if(isValid){ isValid = _ejeValidation.apply(item,arguments);}else _ejeValidation.apply(item,arguments); });
        esferas.forEach((item)=>{ if(isValid){ isValid = _esferaValidation.apply(item,arguments);}else _esferaValidation.apply(item,arguments); });
        cilindros.forEach((item)=>{ if(isValid){ isValid = _cilindroValidation.apply(item,arguments);}else _cilindroValidation.apply(item,arguments); });

        return isValid;
      }

      this._formData[1] = new Array(2);

      this.listenTo(app.eventBus,'refractionResponse',(option)=>{
        this._extraRecipe = option[0];
        this._firstRefractionPass = true;
        if(option[0]){
          this._formList[1].parentNode.childNodes[((option[1]==0)?1:0)].setAttribute('style','display:none');
          this._formList[1].parentNode.childNodes[option[1]].removeAttribute('style');
        }else{
          switch (option[2]) {
            case 0:
              this.changeSection();
              break;
            case 1:
              this.goToNextSection();
              break;
            default:
              this.goToLastSection();
              break;
          }
        }
      });

      this._firstRefractionPass = false;

      refractionSelector.serializeForm = receta;
      refractionSelector.parentNode.childNodes[1].serializeForm = receta;

    },
    goToNextSection:function(){

      let currentForm = this._formList[this._current],
          currentButton = this.el.querySelector(`button[ttip="${currentForm.getAttribute('name')}"]`);

      if(this._current >= this._max) return;


      if(currentForm.validate()){

        if(this._current == 0 && currentForm.getAttribute('name')=='Cliente' && !this._checkforclient){
          currentForm.submit();  return;
        }

        if(this._current == 1 && currentForm.getAttribute('name')=='Refracción' && !this._firstRefractionPass){
          app.eventBus.trigger('confirmMessage',{method:1});
          return;
        }else if(this._current == 1 && currentForm.getAttribute('name')=='Refracción' && !this._extraRecipe){
          this._formList[1].parentNode.childNodes[1].setAttribute('style','display:none');
          this._formList[1].parentNode.childNodes[0].removeAttribute('style');
          this._firstRefractionPass = false;
        }

        this.renderNextSection(currentForm, currentButton);

      }// fin del validate

    },
    goToLastSection:function(){

      let currentForm = this._formList[this._current],
          currentButton = this.el.querySelector(`button[ttip="${currentForm.getAttribute('name')}"]`);

      if(this._current <= 0) return;

      if(currentForm.validate()){

        if(this._current == 0 && currentForm.getAttribute('name')=='Cliente' && !this._checkforclient){
          currentForm.submit();  return;
        }

        if(this._current == 1 && currentForm.getAttribute('name')=='Refracción' && !this._firstRefractionPass){
          app.eventBus.trigger('confirmMessage',{method:2});
          return;
        }else if(this._current == 1 && currentForm.getAttribute('name')=='Refracción' && !this._extraRecipe){
          this._formList[1].parentNode.childNodes[1].setAttribute('style','display:none');
          this._formList[1].parentNode.childNodes[0].removeAttribute('style');
          this._firstRefractionPass = false;
        }

        this.renderLastSection(currentForm, currentButton);

      }// fin del validate

    },
    bindSelects: function(){
      let cseltipo = this.el.querySelector('c-select[name="tipo"]'),
          cselmaterial = this.el.querySelector('c-select[name="material"]'),
          cselcolor = this.el.querySelector('c-select[name="lente"]'),
          cselfiltro = this.el.querySelector('c-select[name="filtro"]'),
          div = this.el.querySelector('div.filtros');

      cseltipo._csel.appendChild(createElement('option',{'value':'0','textContent':'Elegir tipo de lente'}));

      app.fixedData.lentes.tipos.forEach((item)=>{
        cseltipo._csel.appendChild(createElement('option',{'value':item,'textContent':item}));
      });

      cseltipo.listeners = function(){

        cselmaterial.clear();
        cselcolor.clear();
        cselfiltro.clear();
        while(div.firstChild) div.removeChild(div.firstChild);
        cselmaterial._csel.appendChild(createElement('option',{'value':'0','textContent':'Elegir material de lente'}));
        if(this.value == "0")
          return;
        app.fixedData.lentes.materiales[this.value].forEach(item=>{
          cselmaterial._csel.appendChild(createElement('option',{'value':item,'textContent':item}));
        });
      }

      cselmaterial.listeners = function(){
        cselcolor.clear();
        cselfiltro.clear();
        while(div.firstChild) div.removeChild(div.firstChild);
        cselcolor._csel.appendChild(createElement('option',{'value':'0','textContent':'Elegir color de lente'}));
        if(this.value == "0")
          return;
        app.fixedData.lentes.colores[cseltipo.value+"-"+this.value].forEach((value,key)=>{
          cselcolor._csel.appendChild(createElement('option',{'value':value,'textContent':key}));
        });
      }

      cselcolor.listeners = function(){
        cselfiltro.clear();
        while(div.firstChild) div.removeChild(div.firstChild);
        cselfiltro._csel.appendChild(createElement('option',{'value':'0','textContent':'Elegir filtro de lente'}));
        if(this.value == "0")
          return;
        else{
          app.fixedData.lentes.data.get(Number(this.value))[3].forEach(item=>{
            cselfiltro._csel.appendChild(createElement('option',{'value':item,
              'textContent':app.fixedData.filtros.data.get(item)}));
          });
        }
      }

      cselfiltro.listeners = function(){

        if(this.value == "0")
          return;
        let flag = false, val = this.value, text = this.options[this.selectedIndex].text;


        div.querySelectorAll('c-tag').forEach(item =>{
          if(!flag)
            flag = (item.value == this.value);
          else
            item.value == this.value;
        },this)

        this.selectedIndex = 0;

        if(flag)
          return;

        div.appendChild(createElement('c-tag',{
          title : text,
          name  : 'filters',
          value : val,
        },true));

      }

    },
    extraSections:function(){
      let referenceNode = this.el.querySelector('c-form[name="Aro"]').parentNode,
          section = document.createElement('section');

      section.appendChild(refraction_template.content.cloneNode(true));
      section.appendChild(refraction_template.content.cloneNode(true));
      section.childNodes[1].setAttribute('style','display:none');

      section.childNodes[1].querySelector('input[type="checkbox"]').id = "onoff2"
      section.childNodes[1].querySelector('label.onoffswitch-label').setAttribute('for','onoff2');

      referenceNode.before(section);
      referenceNode.before(lens_template.content.cloneNode(true));
    },
    borrar: function(){
      let refractionSelector = this._formList[1],
          ejes = refractionSelector.querySelectorAll('input[name="eje"]'),
          cilindros = refractionSelector.querySelectorAll('input[name="cilindro"]'),
          esferas = refractionSelector.querySelectorAll('input[name="esfera"]');

      ejes.forEach((item)=>{item.removeEventListener('blur',_ejeValidation);});
      cilindros.forEach((item)=>{item.removeEventListener('blur',_cilindroValidation);});
      esferas.forEach((item)=>{item.removeEventListener('blur',_esferaValidation);});
    },
    changeSection: function(event){

      let clickedButton = event.currentTarget,
          currentButton = this.el.querySelector('button.left-menu-btn.active'),
          currentForm   = this.el.querySelector(`c-form[name=${currentButton.getAttribute('ttip')}]`),
          wantedForm    = this.el.querySelector(`c-form[name=${clickedButton.getAttribute('ttip')}]`);

      if (clickedButton === currentButton) return;

      if(currentForm.validate()){

        if(this._current == 0 && currentForm.getAttribute('name')=='Cliente' && !this._checkforclient){
          currentForm.submit('changeSection',event);  return;
        }

        this.renderChangeSection(clickedButton,currentButton,currentForm,wantedForm);
      }

    },
    render:function(){
      this._contentElement.appendChild(this.el);
      this.bindSelects();
    },
    saveFormData: function(){

      if(this._current == 1){
        if(this._extraRecipe){
          this._formData[1][0] = this._formList[1].serializeForm();
          this._formData[1][1] = this._formList[1].parentNode.childNodes[1].serializeForm();
        }else{
          this._formData[1][0] = this._formList[1].serializeForm();
        }
      }else if(this._current==2){
        let div = this.el.querySelector('div.filtros');
        OrdenAroView.prototype.saveFormData.apply(this,arguments);

        div.childNodes.forEach(item=>{
          if(this._formData[2].hasOwnProperty('filtros'))
            this._formData[2].filtros.push(item.value);
          else {
            this._formData[2].filtros = [];
            this._formData[2].filtros.push(item.value);
          }
        },this);

        delete this._formData[2].material;
        delete this._formData[2].tipo;
        delete this._formData[2].filtro;

      }else{
        OrdenAroView.prototype.saveFormData.apply(this,arguments);
      }
    },
    submit:function(event){

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

      if(selected.value != 0 && !abono.value){
        abono.setToolTip('Debe ingresar la cantidad a abonar');
        return;
      }else if(selected.value != 0 && abono.value && Number(abono.value) > Number(total)){
        abono.setToolTip('La cantidad a abonar no puede superar el total de la orden');
        return;
      }else if(selected.value == 0 && abono.value){
        abono.setToolTip('Si selecciona la opción sin abono deje en blanco este campo');
        return;
      }else{
        abono.setToolTip();
        abono.iconChange(1);
      }

      _.extend(this._formData[this._max],this._formList[this._max].serializeForm(),{'total':total});
      this._formData[this._max].payform = selected.value;
      app.eventBus.trigger('renderForm', parseFormData(this._formData),['Información cliente','Información refracción','Información lente',
                                                                            'Información aro','Información pago']);

    },
    submitToServer:function() {

      let data = {};

      data.cliente = this._formData[0];
      this._clientModel && (data.cliente.id = this._clientModel);
      data.refraccion = this._formData[1][0];
      data.refraccion_2 = (!this._formData[1][1])?{}:this._formData[1][1];
      data.lente = this._formData[2];
      data.inventario = this._formData[3].inventario;
      data.observaciones = this._formData[3].observaciones;
      _.extend(data,this._formData[4]);

      app.opxhr(app.urls.ordencompleta,'POST',JSON.stringify(data),true).then( (data)=>{

        this.destroy_view();
        let newWindow = window.open('/');

        newWindow.onload = () => {
            newWindow.location = URL.createObjectURL(data);
        };

      });
    },
  });

  var OrdenLenteView = OrdenCompletaView.extend({
    initialize: function(){
      OrdenCompletaView.prototype.initialize.apply(this,arguments);
      let sections = this.el.querySelectorAll('section');
      this._formList.length = 0
      sections.forEach((item,index)=>{
        if(index == 3)
          item.remove();
        else if(index != 3 && index != 4)
          this._formList[index] = item.firstElementChild;
        else if(index == 4)
          this._formList[3] = item.firstElementChild;
      },this)

      this._formList[2].firstElementChild.setAttribute('style','margin-top: 20px;padding: 15px 25px 10px; overflow:auto; height:76vh;');
      let refNode = this._formList[2].firstElementChild.lastElementChild,
          obsdivbtn = createElement('div',{'class':'add-obs-div'}),
          obsdiv = createElement('div',{'style':'display:none;'});
      obsdivbtn.innerHTML = `<button id="add-obs">Observaciones <span class="fa fa-sticky-note"></span></button></div>`
      obsdiv.innerHTML = `<label class="title">Observaciones</label><textarea placeholder="Algún comentario a agregar, patologías o antecedentes. [Máximo de 255 caracteres]" rows="3" maxlength="255" name="observaciones"></textarea>`
      refNode.parentNode.insertBefore(obsdivbtn,refNode);
      refNode.parentNode.insertBefore(obsdiv,refNode);
      this._obsFn = function(event){
        let observaciones = this._formList[2].firstElementChild.querySelector('textarea');
        if(observaciones.parentNode.style.display == 'none'){
          observaciones.parentNode.style.display = 'block';
          event.currentTarget.setAttribute('style','color: #ffffff;background: #252424;');
        }else {
          observaciones.parentNode.style.display = 'none';
          event.currentTarget.removeAttribute('style');
        }
      }.bind(this)

      obsdivbtn.querySelector('#add-obs').addEventListener('click', this._obsFn);

      let div = this.el.querySelector('div.left-sidebar div');
      while(div.firstChild) div.firstChild.remove();
      this._renderButtons();
      this._max = this._formList.length - 1;
      console.log(this);
    },
    fillCollections: null,
    submitToServer:function() {

      let data = {};

      data.cliente = this._formData[0];
      this._clientModel && (data.cliente.id = this._clientModel);
      data.refraccion = this._formData[1][0];
      data.refraccion_2 = (!this._formData[1][1])?{}:this._formData[1][1];
      data.lente = this._formData[2];
      data.observaciones = this._formData[2].observaciones;
      _.extend(data,this._formData[3]);
      console.log(data);
      $.ajax({
        url: app.urls.ordenlente,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(succ){
          console.log(succ);
          alert('success');
        },
        error: function(error){
          console.log(error);
          alert('error');
        }
      });
    },
    destroy_view: function () {
      this._formList[2].querySelector('#add-obs').removeEventListener('click',this._obsFn);
      OrdenCompletaView.prototype.destroy_view.apply(this,arguments);
    },
  });

  var OrdenesView = TemplateView.extend({
    className: "menu-bar btn-options",
    events:{
      'click #orden-completa':'complete_order',
      'click #orden-aro':'aro_order',
      'click #orden-repair':'repair_order',
      'click #orden-lente':'lens_order',
      'click #orden-examen':'test_order',
    },
    repair_order: function() {
      this.renderView(new OrdenLenteView({contentElement:this._contentElement}));
    },
    lens_order: function(){
      this._current =  new app.tmp({_contentElement:document.getElementById('main'),
      collection: app.ordencompleta,
      orderTemplate:`<c-form id="orden-form">
                      <form>
                          <h1> Información Orden</h1>
                  		    <hr class="linear">
                          <div class="ordenes-static-info">
                              <label>NÚMERO DE ORDEN:</label>
                              <label><%= model.get('id') %></label>
                              <div class="orden-info-grid">
                              <% ['fecha','entrega','lente','filtros','cliente','aro','ventalente','costolente','total','observaciones'].forEach(function(item, index){%>
                                <% if (index % 2 == 0){ %>
                                  <div>
                                <% } %>
                                <% if(item == 'filtros'){ %>
                                  <label><%= item %>:</label>
                                  <label><%= model.get(item).join(' , ') %></label>
                                <% }else if( item == 'observaciones'){ %>
                                  <label>Observ.:</label>
                                  <div class="obs-box">
                                    <label><%= model.get(item) %></label>
                                  </div>
                                <% }else{ %>
                                 <label><%= (item == 'ventalente')?"lente(V)":(item == "costolente")?"Lente(C)":item %>:</label>
                                 <label><%= model.get(item) %></label>
                                <% } %>
                                <% if (index % 2 == 1){ %>
                                  </div>
                                <% } %>
                              <% }) %>
                              <div>
                                <label>Status:</label>
                                <label name="status"><%= model.get('status') %></label>
                                <label>Nota:</label>
                                <div class="obs-box">
                                  <label><%= model.get('notas') %></label>
                                </div>
                              </div>
                            </div>
                              <div class="clearfix">
                                <h3>Abonos:</h3>
                                <div class="clearfix abono-info">
                                <% model.get('abonos').forEach(function(item){ %>
                                  <div>
                                    <label><%= item[1] %></label>
                                    <% if (item[2]){%>
                                    <button class="rounded-btn" name="delete-abono" value="<%= item[0] %>" type="button">
                                      <i class="fa fa-trash"></i>
                                    </button>
                                    <% }else{%>
                                      <span class="cancelado fa fa-times">
                                    <% } %>
                                  </div>
                                <% }); %>
                                </div>
                                <button type="button" id="new-abono">Nuevo abono <span class="fa fa-plus"></span></button>
                              </div>
                          </div>
                      </form>
                  </c-form>
                  <c-form id="abono-orden-form" style="display:none;"></c-form>`,
      });
    },
    initialize: function(options){
       this._modal = new ModalView();
       this._current = null;
       this.el.appendChild(document.getElementById('orden-template').content.cloneNode(true));
       this._contentElement = options.contentElement;

       app.fixedData.lentes.fetch().then(function(data){

         app.fixedData.lentes.tipos = new Set();
         app.fixedData.lentes.materiales = {};
         app.fixedData.lentes.colores = {};

         data[0].results.forEach((item) =>{

           let key = Object.keys(item)[0];

           app.fixedData.lentes.tipos.add(item[key][0]);
           if(app.fixedData.lentes.materiales.hasOwnProperty(item[key][0]))
              app.fixedData.lentes.materiales[item[key][0]].add(item[key][1]);
           else{
             app.fixedData.lentes.materiales[item[key][0]] = new Set();
             app.fixedData.lentes.materiales[item[key][0]].add(item[key][1]);
           }

           if(app.fixedData.lentes.colores.hasOwnProperty(item[key][0]+"-"+item[key][1]))
              app.fixedData.lentes.colores[item[key][0]+"-"+item[key][1]].set(item[key][2],key);
           else{
             app.fixedData.lentes.colores[item[key][0]+"-"+item[key][1]] = new Map();
             app.fixedData.lentes.colores[item[key][0]+"-"+item[key][1]].set(item[key][2],key);
           }

         });

       });

       app.fixedData.filtros.fetch();



    },
    aro_order:function(){
       this.renderView(new OrdenAroView({contentElement:this._contentElement}));
    },
    complete_order: function(){
       this.renderView(new OrdenCompletaView({contentElement:this._contentElement}));
    },
    renderView: function(view){
     if(this._current){
       this._current.destroy_view();
     }
     this.el.setAttribute('style','display:none');
     this._current = view;
     view.on('done',()=>{ this.el.removeAttribute('style');});
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
