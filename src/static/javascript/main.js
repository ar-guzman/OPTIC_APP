/*
  =========================
  = funciones auxiliares  =
  =========================
*/


function changeErrorSuccess(element){

    var iTag = $(element).siblings('i')[0];

    switch(isInputValid(element)) {
        case 0:
            $(iTag).addRemoveClass(
            {addClase:'fa-warning warning-fa',removeClase:'fa-success success-fa required-fa fa-asterisk fa-question'});
            return false;
        case 2:
            $(iTag).addRemoveClass(
            {addClase:'fa-question required-fa',removeClase:'fa-warning warning-fa fa-asterisk fa-success'});
            return true;
        default:
            $(iTag).addRemoveClass(
            {addClase:'fa-check success-fa',removeClase:'fa-warning warning-fa required-fa fa-asterisk fa-question'});
            return true;
    }
}

/*  funciones para validar los selects */
function isSelectValid(element){
    var iTag = $(element).siblings('i')[0];
    if(!element.checkValidity()){
        $(iTag).addRemoveClass(
            {addClase:'fa-warning warning-fa',removeClase:'fa-success success-fa required-fa fa-asterisk'}
        );
        return false;
    }else{
        //si el elemento que revisamos es válido por patrón y requerimiento
        $(iTag).addRemoveClass(
            {addClase:'fa-check success-fa',removeClase:'fa-warning warning-fa required-fa fa-asterisk'}
        );
        return true;
    }
}


function nextTab(elem) {
    $(elem).next().find('a[data-toggle="tab"]').click();
}

function prevTab(elem) {
    $(elem).prev().find('a[data-toggle="tab"]').click();
}


function populateSelect(){
    var sel = document.getElementById('edadcliente');
    for(var i = 7; i <= 90; i++){
        var el = document.createElement("option");
        el.innerHTML = i;
        el.value = i;
        sel.appendChild(el);
    }
}


function addInput(element){
    var input = $(element).parent().siblings("input");
    var val = parseFloat(input.val());

    if(isNaN(val)){ input.val('0.00'); return; }

    if( val < 20){
        val+= 0.25;
        input.val(val.toFixed(2));
    }
}

function lessInput(element){
    var input = $(element).parent().siblings("input");
    var val = parseFloat(input.val());

    if(isNaN(val)){ input.val('0.00'); return; }

    if(val > -20 ){
        val-= 0.25;
        input.val(val.toFixed(2));
    }
}

function addInputInteger(element){
    var input = $(element).parent().siblings("input");
    var val = parseInt(input.val());

    if(isNaN(val)) {input.val('0'); return;}

    if( val < 120){
        val+= 1;
        input.val(val);
    }
}

function lessInputInteger(element){
    var input = $(element).parent().siblings("input");

    var val = parseInt(input.val());

    if(isNaN(val)) {input.val('0'); return;}

    if(val > 0 ){
        val-= 1;
        input.val(val);
    }else{
        input.val('0');
    }
}

/* form validation */
function isInputValid(element){
    if(!element.checkValidity()){
        //si el elemento que revisamos no es válido por patrón o valor
        $(element).addRemoveClass({addClase:"has-error",removeClase:"has-success"});
        return 0;
    }else{
        //si el elemento que revisamos es válido por patrón y requerimiento
        if(!element.hasAttribute('required')){
            //atributos opcionales que deben cambiarse de clase a successfull
            if(element.value != ""){
                $(element).addRemoveClass({addClase:"has-success",removeClase:"has-error"});
                return 1;
            }else{
                $(element).addRemoveClass({removeClase:"has-error has-success"});
                return 2;
            }
        }
        else {
            $(element).addRemoveClass({addClase:"has-success",removeClase:"has-error"});
            return 3;
        }
    }
}

function resetForm(button){
    var form = $(button).parent().parent().parent()[0];
    form.reset();
    var inputList = $(form).find('input');
    //Código se va a modificar para aplicar a todas las formas
    for(var i = 0; i<inputList.length; i++)
        resetElement(inputList[i]);
}

function resetElement(element){
    /*  Obtener el elemento i si es que este existe, luego borrar las clases del input/select */
    var iTag = $(element).siblings('i')[0];
    $(element).addRemoveClass({removeClase:"has-error has-success"});

    /*  Si el elemento es requerido reseteamos i a requerido(*), caso contrario lo reseteamos a no requerido (?)*/
    if($(element).prop('required')){
        $(iTag).addRemoveClass({addClase:"fa-asterisk required-fa",removeClase:"fa-warning warning-fa fa-asterisk fa-success"});
    }else{
        $(iTag).addRemoveClass({addClase:"fa-question required-fa",removeClase:"fa-warning warning-fa fa-asterisk fa-success"});
    }
}

/*
=========================
=    JQUERY PLUGIN      =
=========================
*/

/* JQuery plugin */
(function($){
    $.fn.extend({
        terminarIngresar: function(callback,timeout){
            timeout = timeout || 1e3/2; // 1/2 segundo default
            var timeoutReference,
                finIngresar = function(el){
                    if (!timeoutReference) return;
                    timeoutReference = null;
                    callback.call(el);
                };
            return this.each(function(i,el){
                var $el = $(el);
                // Chrome Fix (Usa keyup sobre keypress para detectar el backspace)
                $el.is(':input') && $el.on('keyup keypress paste',function(e){
                    // Sin esta línea de código
                    // utilizar tab/shift+tab hace que el elemento dispare el callback
                    if (e.type=='keyup' && e.keyCode!=8) return;

                    // Revisar si el timeout fue seteado. si lo fue, "resetear" el reloj y
                    // empezar la cuenta de nuevo
                    if (timeoutReference) clearTimeout(timeoutReference);
                    timeoutReference = setTimeout(function(){
                        // si llego hasta acá significa que ha pasado 1/2 segundo. Disparar
                        // el callback
                        finIngresar(el);
                    }, timeout);
                }).on('blur',function(){
                    // Si se aleja del input, disparar el evento
                    if (timeoutReference) clearTimeout(timeoutReference);
                    callback.call(el);
                });
            });
        }
    });
})(jQuery);

//'fa-asterisk fa-question required-fa fa-warning has-error'
//'fa-check has-success'
/* Jquer plugin para remover clases*/
(function($){
    $.fn.addRemoveClass = function(opciones){
    /* opciones tiene las clases */
        var opts = jQuery.extend({}, $.fn.addRemoveClass.defaults, opciones);

        return this.each(function() {
            $(this).removeClass(opts.removeClase);
            $(this).addClass(opts.addClase);
        });
    };

    $.fn.addRemoveClass.defaults = {
        addClase: '',
        removeClase: ''
    };
})(jQuery);

