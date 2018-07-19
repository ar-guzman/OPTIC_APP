(function (app,_) {

let template = document.getElementById("table-template"),
    i_template = document.getElementById("input-template"),
    s_template = `
      <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.0.9/css/all.css"
        integrity="sha384-5SOiIsAziJl6AWe0HWRKTXlfcSHKmYV4RBF18PPJ173Kzn7jzMyFuTtk8JA7QQG1" crossorigin="anonymous">
      <style>

      @keyframes pulse {
        0%  { box-shadow: 0 0 0 0 #f94340; }
        50% { box-shadow: 0 0 0 15px rgba(249, 67, 64,0.5);}
        100% { box-shadow: 0 0 0 30px transparent; }
      }

      select.selc-style,select.selc-style:focus {
        border:transparent;
        padding:2px;
        height: 5vh;
        font-size: 2vh;
        font-weight: 400;
        width: var(--selc-sel-width,50%);
        outline: none;
        margin: 0 1vh;
        transition: background 1s;
        box-shadow: 0px 9px 12px -5px rgba(11,11,11,0.5);
      }

      .sel-titulo label {
        padding: var(--selc-label-padding,0);
      }

      .sel-titulo > span {
        position: absolute;
        right: 0;
        line-height: inherit;
        font-size: medium;
        padding-top: 4px;
      }

      .sel-titulo{
        font-size: var(--selc-title-size,3.5vh);
        color: var(--selc-title-color,#4682B4);
        display: var(--selc-title-display,block);
        width: var(--selc-title-width,auto);
        position: relative;
      }

      .sel-legend{
        font-size: 2vh;
        color: var(--selc-legend-color,#081821);
        display: var(--selc-legend--display, block);
      }

      span.fa.fa-check-circle { color: #15ff5f; }
      span.fa.fa-times-circle { color: #f94340; }
      .success { background-color:#15ff5f; color:white; }
      .error   { background-color:#f94340; color:white; animation: pulse 0.5s ease-in;}

      </style>
      <div class="sel-titulo">
        <label></label>
        <span></span>
      </div>
      <select class="selc-style">
      </select>
      <label class="sel-legend"></label>`
      ;

class CTable extends HTMLElement {
    /*  cuando termine el input hacer que la tabla filtre lo actual, si Desea
        hacer una llamada al servidor entonces presionar boton
    */
    constructor() {
      super();
      this.attachShadow({mode: 'open'});
      this.shadowRoot.innerHTML = template.innerHTML;
      this._cform = this.shadowRoot.querySelector('c-form');
    }

    fetchCollection(page){

      let info = this._cform.parseData(page);

      this._collection && this._collection.fetch({
        data: info
      });

    }

    /*
    * SET y GET EN GENERAL
    */
    set collection(collection){
      this._collection = collection;
    }

    setAttr(percentages,header){
      this._percentages = percentages;
      this._header      = header;
    }

    getTHead(){
        return this.shadowRoot.querySelector('thead');
    }

    getTBody(){
      return this.shadowRoot.querySelector('tbody');
    }

    getTFooter(){
      return this.shadowRoot.querySelector('.table-footer div');
    }

    getFilters(){
      return this.shadowRoot.querySelector('div.extra-filter');
    }

    setStyle(innerStyle){
        let style = document.createElement('style');
        style.innerHTML = innerStyle;
        this.shadowRoot.insertBefore(style, this.shadowRoot.firstChild);
    }
    /*
    * FUNCIONES NATIVAS
    */
    connectedCallback(){
        this.createFooter();
        this.renderStyle();
        this.renderHeader();
        this.renderFooter();
    }

    /*
    * FUNCIONES DE RENDERIZADO
    */
    renderStyle(){
        let style = document.createElement("style");
        /*  Crear el estilo específico para la tabla */
        style.innerHTML +=  ":host{ display:block }\n";

        _.each(this._percentages, function(el,index){
            this.innerHTML += `th:nth-child(${index+1}),td:nth-child(${index+1}) {
              width:${el}%;
            }
            `;
        },style);

        this.shadowRoot.insertBefore(style, this.shadowRoot.firstChild);
    }

    renderHeader(){

      let tr = document.createElement('tr');
        _.each(this._header, function(el){
            let th = document.createElement("th");
            th.textContent = el;
            this.appendChild(th);
        },tr);

      this.getTHead().appendChild(tr);

    }

    renderEmptyTable(){
      let tr = document.createElement('tr'),
          td = document.createElement('td');
      /*  Creamos y añadimos la fila al cuerpo de la tabla */
      td.setAttribute('colSpan',this._header.length);
      td.textContent = '## No hay ningún resultado ##';
      td.setAttribute('style','width:100%');
      tr.appendChild(td);
      /*  Reajustamos la altura de la tabla */
      this.getTBody().setAttribute('style','height:auto');
      this.getTBody().appendChild(tr);
    }

    clearFooter(){

      let footer = this.getTFooter();

      while (footer.firstChild) footer.removeChild(footer.firstChild);

    }

    clearBody(){
      let tbody = this.getTBody();

      while (tbody.firstChild)
        tbody.removeChild(tbody.firstChild);
    }

    renderFooter(){
      /* Limpiamos el footer */
      this.clearFooter();

      this._collection._previous &&
        this.getTFooter().append(this._buttonsFooter[0]);

      if(this._collection.length){
        this._buttonsFooter[1].textContent = this._collection._current;
        this.getTFooter().append(this._buttonsFooter[1]);
      }

      this._collection._next &&
        this.getTFooter().append(this._buttonsFooter[2]);
    }

    createFooter(){
        this._buttonsFooter = [];

        let prevBtn     = document.createElement('Button'),
            currentBtn  = document.createElement('Button'),
            nextBtn     = document.createElement('Button');

        prevBtn.setAttribute('class','fa fa-backward');
        nextBtn.setAttribute('class','fa fa-forward');

        this._buttonsFooter.push(prevBtn);
        this._buttonsFooter.push(currentBtn);
        this._buttonsFooter.push(nextBtn);

        this._functionReferences = [];

        let prevHandler = ()=>{
          this.fetchCollection(this._collection._current - 1);
        },
        currentHandler = ()=>{
          this.fetchCollection(this._collection._current);
        },
        nextHandler = ()=>{
          this.fetchCollection(this._collection._current + 1);
        };

        this._functionReferences.push(prevHandler);
        this._functionReferences.push(currentHandler);
        this._functionReferences.push(nextHandler);

        _(this._buttonsFooter).each(function(button,index){
          button.addEventListener('click',this._functionReferences[index]);
        },this);
    }

    removeFooter(){
      /*  Eliminar los listeners y el elemento */
        _(this._buttonsFooter).each(function(btn,index){
            btn.removeEventListener(this._functionReferences[index]);
            btn.remove();
        },this);
    }

  }

class CInput extends HTMLElement {

    constructor(msn, pattern, required, title, name, tipo){
      super();
      this._required   = required || this.hasAttribute('required');
      this._message    = (msn     || this.getAttribute('message'))  || null;
      this._pattern    = (pattern)?new RegExp(pattern):(this.getAttribute('pattern'))
                             ?new RegExp(this.getAttribute('pattern')):null;
      this._title      = (title   || this.getAttribute('titulo'))   || null;
      this._name       = (name    || this.getAttribute('name'))     || null;
      this._tipo       = (tipo    || this.getAttribute('tipo'))     || null;
      this.attachShadow({mode:'open'});
      this.shadowRoot.appendChild(i_template.content.cloneNode(true));
      this.finishIn();
      this.iconChange(0);
      this._callback = [];
    }

    static get observedAttributes() {
      return ['disabled'];
    }

    get disabled() {
      return this.hasAttribute('disabled');
    }

    set disabled(val) {

      if (val) {
        this.setAttribute('disabled', '');
        this.shadowRoot.querySelector('input').setAttribute('readonly','');
      } else {
        this.removeAttribute('disabled');
        this.shadowRoot.querySelector('input').removeAttribute('readonly','');
      }
    }


    attributeChangedCallback(name, oldValue, newValue) {

      if (this.disabled) {
        this.shadowRoot.querySelector('input').setAttribute('readonly','');
      } else {
        this.shadowRoot.querySelector('input').removeAttribute('readonly');
      }

    }

    /*
    * SET Y GET Generales
    */
    get value(){
      if(this._tipo == 'file')
        return this.shadowRoot.querySelector('input').files[0];
      else if(this._tipo == 'datetime-local')
        return new Date(this.shadowRoot.querySelector('input').value).getTime();
      else
        return this.shadowRoot.querySelector('input').value;
    }

    set value(val){this.shadowRoot.querySelector('input').value = val;}

    set password(value){ this._password = (value)?value:"";}

    set title(val){
      if(val){
        this.setAttribute('title',val);
        this._title = val;
      }else{
        this.removeAttribute('title');
        this._title = null;
      }
    }

    get title(){
      return this._title;
    }

    set message(sms){
      if(sms){
        this.setAttribute('message',sms);
        this._message = sms;
      }else {
        this._message = null;
        this.removeAttribute('message');
      }
    }

    get message(){
      return this._message;
    }

    get name(){
      return this._name;
    }

    set required(val){
      if (val){
        this.setAttribute('required','');
      } else{
        this.removeAttribute('required');
      }
    }

    get required(){
      return this.hasAttribute('required');
    }

    setToolTip(msn,pos){
      if(msn){
        this.setAttribute('ttip',msn);
        this.setAttribute('ttip-position',((pos)?pos:'top'));
        this.iconChange.call(this,2);
      }
      else{
        this.removeAttribute('ttip');
        this.removeAttribute('ttip-position');
        this.iconChange.call(this,0);
      }
    }

    set listeners(option){
      if(option && typeof(option) === "function"){
        this.shadowRoot.querySelector('input').addEventListener('blur',option);
        this._callback.push(option);
      }
    }

    get listeners(){
      return this._callback;
    }

    validate(){
      let input = this.shadowRoot.querySelector('input'),
          text = input.value;
          /* verificar si es requerido*/
      let empty = text === "" || !(/\S/).test(text);

      if(!this._required && empty){
        if(this._extraValidationStep)
          return this._extraValidationStep();
        return true;
      }

      if(this._required && empty) {
        this.setToolTip.call(this,"Campo obligatorio, llenar");
        return false;
      }

      if(input.getAttribute('type') == 'email' && input.validity.typeMismatch)
      {
        this.setToolTip.call(this,"Debe ingresar un correo electrónico válido")
        return false;
      }

      if(this._tipo == 'password' && this._name == 'confirmation_password'){

        if(this._password != this.value){
          this.setToolTip.call(this,"Las contraseñas no coinciden");
          return false;
        }

        this.iconChange.call(this,1);
        return true;
      }

      if(this._pattern){

        if(this._pattern.test(text)){
          this.iconChange.call(this,1);
        }else{
          this.setToolTip.call(this,
          "El patrón no concuerda, revisar el mensaje debajo de la caja de texto");
          return false;
        }

      }else
        this.iconChange.call(this,1);


      if(this._extraValidationStep)
        return this._extraValidationStep();

      return true;


    }

    connectedCallback(){
      let input = this.shadowRoot.querySelector('input');
      if(this._tipo){
        input.setAttribute('type',this._tipo);
        this._tipo == 'file' && input.setAttribute('style','border:0px;');
        (this._tipo == 'file' && this.hasAttribute('images')) && input.setAttribute('accept',"image/*");
      }
      if(this.hasAttribute('value')){
        this.shadowRoot.querySelector('input').value = this.getAttribute('value');
        this.validate();
      }

      this.shadowRoot.querySelector('.titulo').querySelector('label').textContent = this._title;
      this.shadowRoot.querySelector('.legend').textContent = this._message || "";
    }

    disconnectedCallback(){
      let inp = this.shadowRoot.querySelector('input');

      this._callback.forEach((item)=>{inp.removeEventListener('blur',item)});

      inp.removeEventListener('blur',    this._fnRef);
      inp.removeEventListener('keyup',   this._fnRef);
      inp.removeEventListener('paste',   this._fnRef);
      inp.removeEventListener('keypress',this._fnRef);

    }

    reset(){
      this.setToolTip.call(this);
    }

    finishIn(){
      var el = this.shadowRoot.querySelector('input'),
          timeout = 500,
          timeoutReference = null,
          fnRef = this.validate,

          finIn = (function(){
              if (!timeoutReference) return;
              timeoutReference = null;
              this.reset.call(this);
              fnRef.call(this);
          }).bind(this);

      // Chrome Fix (Usa keyup sobre keypress para detectar el backspace)
      var matches = function(el, selector) {
        return (el.matches || el.matchesSelector || el.msMatchesSelector
          || el.mozMatchesSelector || el.webkitMatchesSelector
          || el.oMatchesSelector).call(el, selector);
      };

      let actionFn = function(e){
          // Sin esta línea de código
          // utilizar tab/shift+tab hace que el elemento dispare el callback
          if (e.type =='keyup' && e.keyCode!=8) return;

          // Revisar si el timeout fue seteado. si lo fue, "resetear" el reloj y
          // empezar la cuenta de nuevo
          if (timeoutReference) clearTimeout(timeoutReference);
          timeoutReference = setTimeout(function(){
              // si llego hasta acá significa que ha pasado 1/2 segundo. Disparar
              // el callback
              finIn();
          }, timeout);
      }
      this._fnRef = actionFn;
      el.addEventListener('blur',     actionFn);
      el.addEventListener('keyup',    actionFn);
      el.addEventListener('keypress', actionFn);
      el.addEventListener('paste',    actionFn);

    }

    iconChange(val){
      let span  = this.shadowRoot.querySelector('span'),
          input = this.shadowRoot.querySelector('input');
      switch (val) {
        case 1:
          span.classList.remove('fa-asterisk');
          span.classList.remove('fa-question-circle');
          span.classList.remove('fa-times-circle');
          span.classList.add('fa-check-circle');
          input.classList.remove('error');
          input.classList.add('success');
          break;
        case 2:
          span.classList.remove('fa-asterisk');
          span.classList.remove('fa-question-circle');
          span.classList.remove('fa-check-circle');
          span.classList.add('fa-times-circle');
          input.classList.remove('success');
          input.classList.add('error');
          break;
        default:
          span.classList.remove('fa-asterisk');
          span.classList.remove('fa-question-circle');
          span.classList.remove('fa-times-circle');
          span.classList.remove('fa-check-circle');
          span.classList.add(((this._required)?'fa-asterisk':'fa-question-circle'));
          input.classList.remove('error');
          input.classList.remove('success');
      }
    }

  }

class CForm extends HTMLElement  {

    constructor(url){
        super();
        this.attachShadow({mode:'open'});
        let slot = document.createElement('slot');
        this.shadowRoot.appendChild(slot);
        url && (this._url = url);
    }

    connectedCallback(){
        this.addEventListener('submit',this.submit);
        let selects = this.querySelectorAll('select');
        if(this._collection){
          let func = ()=>{

              let data = this.parseData();

              this._collection.fetch({
                data:data
              });
          }
          this._changeFunction = func;

          selects.forEach(function(Element){
              Element.addEventListener('change',func);
          });
        }
    }

    disconnectedCallback(){
      this.removeEventListener('submit',this.submit);
      let selects = this.querySelectorAll('select');
      selects.forEach(function(Element){
        Element.removeEventListener('change',this._changeFunction);
      }.bind(this));

    }

    set collection(coll){
      this._collection = coll;
    }

    get collection(){
      return this._collection;
    }

    serializeForm(select = false){

      let obj = {}, entries;

      if(!select)
        entries = this.querySelectorAll('c-input,c-select,input,c-datepicker,textarea');
      else
        entries = this.querySelectorAll('c-input,c-select,input,c-datepicker,textarea,select');

      entries.forEach(function(element){
          obj[element.name] = element.value;
      });

      return obj;
    }

    set collection(collection){
      this._collection = collection;
    }

    set url(value){
      this._url = value;
    }

    createStyleSheet(properties){
        let style = document.createElement('style');
        style.innerHTML = properties;
        this.insertBefore(style, this.firstChild);
    }

    parseData(page){

      let data = this.serializeForm();
      // Determinar si existe parámetro página.
      page && (data['page'] = page);
      //Retornamos "" si no tiene elementos y el objeto caso contrario
      if(Object.keys(data).length === 0 && data.constructor === Object) return "";
      return data;
    }

    appendToForm(template){
        //obtenemos el form y le añadimos el hijo si existe
        let form = this.querySelector('form');
        form && form.appendChild(template.content.cloneNode(true));
    }

    appendStylesheet(stylesheet){
      this.insertBefore(stylesheet, this.firstChild);
    }

    reset(){

      let cinputs = this.querySelectorAll('c-input');

      cinputs.forEach(function(el){
        el.reset();
        el.value = "";
      });

    }

    validate(){

      let elementList = this.querySelectorAll('c-input,c-select'),
          isValid = true;

      elementList.forEach(function(element){
          if(isValid)
            isValid = element.validate();
          else
            element.validate();
      });

      return isValid;

    }

    get name(){
      return this.getAttribute('name');
    }

  }

class CSelect extends HTMLElement {

      constructor(name,title,msn,show) {
        super();
        this._message    = (msn     || this.getAttribute('message'))  || null;
        this._title      = (title   || this.getAttribute('titulo'))   || null;
        this._name       = (name    || this.getAttribute('name'))     || null;
        this._show       = (show || this.hasAttribute('show')) || false;
        this.attachShadow({mode: 'open'});
        this.shadowRoot.innerHTML = s_template;
        this._csel = this.shadowRoot.querySelector('select');
        this._callbacks = [];
      }

      /*  GET Y SET */
      get name(){return this._name;}

      set name(val){
        if(val){
          this._name = val;
          this.setAttribute('name',val);
        }else{
          this._name = null;
          this.removeAttribute('name');
        }
      }

      get value(){
        let val = this._csel.options.length > 0  &&  (this._csel.value || this._csel.options[this._csel.selectedIndex].value);
        return (!val)?'':val;
      }

      get text(){
        let index = this._csel.selectedIndex;
        return (index==0)?'':this._csel.options[index].text;
      }

      set title(val){
        if(val){
          this._title = val;
        }else{
          this.removeAttribute('title');
          this._title = null;
        }
      }

      get title(){return this._title;}

      set message(sms){
        if(sms){
          this.setAttribute('message',sms);
          this._message = sms;
        }else {
          this._message = null;
          this.removeAttribute('message');
        }
      }

      set options(opt){

        if(!(opt instanceof Map)) return;

        this.clear();

        let createOpt = function(val,key){
          let d = document.createElement('option');
          d.value = key;
          d.textContent = (val instanceof Array)?val[0]:val;
          this._csel.appendChild(d);
        }

        opt.forEach(function(val,key){
          createOpt.apply(this,[val,key]);
        },this);

      }

      set multipleOptions(opt){

        if(!(opt instanceof Array)) return;

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

      }

      connectedCallback(){
        let labels = this.shadowRoot.querySelectorAll('label');
        if(labels && labels.length == 2 )
          labels[0].textContent = this._title;
          labels[1].textContent = this._message;
        this.reset();
        if(this._show){
          this._callback = this.validate.bind(this);
          this._csel.addEventListener('change',this._callback);
        }
      }

      disconnectedCallback(){
        if(this._show){
          this._csel.removeEventListener('change',this._callback);
        }

        this._callbacks.forEach(
          function(item){ this._csel.removeEventListener('change',item) }.bind(this)
        );

      }

      validate(){

        if(!this._show) return true;

        if(this._csel.options.length == 0){ this.iconChange(2); return false;}

        let val = (this._csel.value || this._csel.options[this._csel.selectedIndex].value);
        if(val == 0){
          this.iconChange(2);
          return false;
        }
        else
          this.iconChange(1);

        return true;

      }

      clear(){

        this.iconChange(0);

        while(this._csel.firstChild)
          this._csel.removeChild(this._csel.firstChild);
      }

      iconChange(val){
        if(!this._show) return;
        let span  = this.shadowRoot.querySelector('span');
        this.removeAttribute('ttip');

        switch (val) {
          case 1:
            span.setAttribute('class','fa fa-check-circle');
            this._csel.classList.add('success');
            this._csel.classList.remove('error');
            break;
          case 2:
            span.setAttribute('class','fa fa-times-circle');
            this.setAttribute('ttip','Debe seleccionar alguna opción');
            this._csel.classList.remove('success');
            this._csel.classList.add('error');
            break;
          default:
            span.setAttribute('class','fa fa-asterisk');
            this._csel.classList.remove('success');
            this._csel.classList.remove('error');
          }
      }

      reset(){
        if(!this._show) return;
        this.iconChange(0);
      }

      set listeners(option){
        if(option && typeof(option) === "function"){
          this._csel.addEventListener('change',option);
          this._callbacks.push(option);
        }
      }
  }

class CDatePicker extends HTMLElement {

    constructor(title,name){
      super();
      this._title      = (title   || this.getAttribute('titulo'))   || null;
      this._name       = (name    || this.getAttribute('name'))     || null;
      this.attachShadow({mode: 'open'});
      this.shadowRoot.innerHTML = `
      <style>
      label{font-size: var(--cdate-font-size,3.5vh); color:
            var(--cdate-label-color,#fff);
            padding: var(--cdate-label-padding,0);
            width:var(--cdate-label-width,125px); }
      input[type="date"]{ background-color: white; height: 5vh;
              outline:none; border:none; width: auto;}
      input[type="date"]::-webkit-clear-button {
        padding:1px;
      }
      input[type="date"]::-webkit-inner-spin-button { visibility: hidden;}
      input[type="date"]::-webkit-calendar-picker-indicator{font-size: 15px; color:black; background: white;}
      * { box-sizing: border-box; }
      </style>
      <label></label>
      <input type = "date">
      `;
      this._callbacks = [];
      this._cdate = this.shadowRoot.querySelector('input');
    }

    disconnectedCallback(){

      this._callbacks.forEach(function(item){
        this._cdate.removeEventListener('change',item);
      },this);

    }

    connectedCallback(){
      this.shadowRoot.querySelector('label').textContent = this._title;
    }

    set title(val){
      if(val){
        this._title = val;
        this.shadowRoot.querySelector('label').textContent = val;
        this.setAttribute('titulo',val);
      }else{
        this._title = null;
        this.shadowRoot.querySelector('label').textContent = "";
        this.removeAttribute('titulo');
      }
    }

    set name(val){
      if(val){
        this._name = val;
        this.setAttribute('name',val);
      }else{
        this._name = null;
        this.removeAttribute('name');
      }
    }

    get title(){
      return this._title;
    }

    get name(){
      return this._name;
    }

    get value(){
      return this._cdate.value;
    }

    set callback(option){

      if(option && typeof(option) === "function"){
        this._cdate.addEventListener('change',option)
        this._callbacks.push(option);
      }

    }
  }

class CTag extends HTMLElement {

  constructor(title,val,name){
    super();
    this._title = (title || this.getAttribute('titulo')) || null;
    this._value = (val || this.getAttribute('value')) || null;
    this._name = (name || this.getAttribute('name')) || null;
    this.attachShadow({mode:'open'});
    this.shadowRoot.innerHTML = `<style>

      *{ box-sizing: border-box; }

      label, button {
        color: white;
        background-color: var(--ctag-bg-color,#58e98e);
        height: var(--ctag-height,5vh);
        font-size: var(--ctag-font-size,2.5vh);
        display: block;
        float: left;
        font-weight: bold;
        padding: 0 4px;
      }

      label {
        border-radius: 5px 0 0 5px;
        line-height: 2;
      }

      button {
        border-radius: 0 5px 5px 0;
        outline: none;
        border: none;
        font-size: 3.5vh;
        border-left: 1px solid white;
      }

      button:hover{
        color:#fff;
        text-shadow: 0 2px 0 #0a0a0a;
        background-color: #f94340;
      }

      div::after{
        content: "";
        clear: both;
        display: block;
      }
      </style>
      <div><label></label><button>x</button></div>`
  }

  connectedCallback(){
    this.shadowRoot.querySelector('label').textContent = this._title;
    this._deleteDOM = function(){ this.parentNode.removeChild(this); }.bind(this)
    this.shadowRoot.querySelector('button').addEventListener('click',this._deleteDOM);
  }

  disconnectedCallback(){
    this.shadowRoot.querySelector('button').removeEventListener('click',this._deleteDOM);
  }

  set name(val){
    if(val){
      this._name = val;
      this.setAttribute('name',val);
    }else{
      this._name = null;
      this.removeAttribute('name');
    }
  }

  get name(){ return this._name; }

  set title(val){
    if(val){
      this._title = val;
      this.setAttribute('titulo',val);
    }else{
      this.removeAttribute('titulo');
    }

  }

  set value(val){
    if(val){
      this._value = val;
      this.setAttribute('value',val);
    }
    else{
      this._value = null;
      this.removeAttribute('value');
    }
  }

  get value(){ return this._value; }


}


  app.customElements.CTable = CTable;
  app.customElements.CInput = CInput;
  app.customElements.CForm  = CForm;
  app.customElements.CSelect = CSelect;
  app.customElements.CDatePicker = CDatePicker;
  customElements.define('c-table',  CTable);
  customElements.define('c-input',  CInput);
  customElements.define('c-form',   CForm);
  customElements.define('c-select', CSelect);
  customElements.define('c-datepicker', CDatePicker);
  customElements.define('c-tag',CTag);
})(app,_);




/*
var addShadowRoot = (function () {
  'use strict';
  var importDoc, shimStyle;

  importDoc = (document._currentScript || document.currentScript).ownerDocument;

  if (window.ShadowDOMPolyfill) {
    shimStyle = document.createElement('style');
    document.head.insertBefore(shimStyle, document.head.firstChild);
  }

  return function (obj, idTemplate, tagName) {
    var template, list;

    obj.root = obj.createShadowRoot();
    template = importDoc.getElementById(idTemplate);
    obj.root.appendChild(template.content.cloneNode(true));

    if (window.ShadowDOMPolyfill) {
      list = obj.root.getElementsByTagName('style');
      Array.prototype.forEach.call(list, function (style) {
        if (!template.shimmed) {
          shimStyle.innerHTML += style.innerHTML
            .replace(/:host\b/gm, tagName || idTemplate)
            .replace(/::shadow\b/gm, ' ')
            .replace(/::content\b/gm, ' ');
        }
        style.parentNode.removeChild(style);
      });
      template.shimmed = true;
    }
  };
}());


/*app.proveedor.fetch({
data: { page: 2 },
add: true,
reset: false,
update: true,
remove: false,
});

def get_sentinel_user():
    return get_user_model().objects.get_or_create(username='deleted')[0]
*/
/*
  agregar un callback para el onchange del select
*/
