from rest_framework.routers import DefaultRouter

from .api.views import EmpleadoViewSet, ClienteViewSet

router = DefaultRouter()
router.register(r'empleado', EmpleadoViewSet, base_name='empleado')
router.register(r'cliente', ClienteViewSet, base_name='cliente')
router.register(r'ordenaro', ClienteViewSet, base_name='ordenaro')