(function ($, Backbone, _, app) {

    var AppRouter = Backbone.Router.extend({
        routes: {
            '': 'home',
            'inventario':'inventario',
            'ordenes':'ordenes'
        },
        initialize: function (options) {
            this.header         = new app.views.HeaderView();
            this.current        = null;
            this.contentElement = document.getElementById('main');
            if(app.session.authenticated()){
              $('body').prepend(this.header.el);
              this.header.render();
            }
            Backbone.history.start();
        },
        home: function () {
            var view = new app.views.HomePageView({contentElement: this.contentElement});
            this.render(view);
        },
        inventario: function(){
            var view = new app.views.InventarioView({contentElement: this.contentElement});
            this.render(view);
        },
        ordenes: function(){
            var view = new app.views.OrdenesView({contentElement: this.contentElement});
            this.render(view);
        },
        route: function (route, name, callback) {
        // Sobreescribir el router para forzar el login en cada página
            var login;
            callback = callback || this[name];
            callback = _.wrap(callback, function (original) {
                var args = _.without(arguments, original);
                if (app.session.authenticated()) {
                    original.apply(this, args);
                } else {
        // Mostrar el login antes de mostrar la vista
                    $(this.contentElement).hide();
        // Bind el callback original una vez el login fue exitoso
                    login = new app.views.LoginView();

                    $(this.contentElement).after(login.render());

                    login.on('done', function () {
                        $('body').prepend(this.header.el);
                        this.header.render();
                        $(this.contentElement).show();
                        original.apply(this, args);
                    }, this);
        // Renderizar el login

                }
            });

            return Backbone.Router.prototype.route.apply(this, [route, name, callback]);
        },
        render: function (view) {
            if (this.current) {
                this.current.destroy_view();
            }
            this.current = view;
            this.current.render();
        }
    });

    app.eventBus = _.extend({}, Backbone.Events);

    app.router = AppRouter;

})(jQuery, Backbone, _, app);
