from django.conf.urls import url
from rest_framework.routers import DefaultRouter

from .api.views import EmpleadoViewSet, ClienteViewSet, AroOrdenViewSet, CompletaOrdenViewSet, refraction_detail, \
    LenteOrdenViewSet, RepairOrdenViewSet
from .views import some_view

router = DefaultRouter()
router.register(r'empleado', EmpleadoViewSet, base_name='empleado')
router.register(r'cliente', ClienteViewSet, base_name='cliente')
router.register(r'ordenaro', AroOrdenViewSet, base_name='ordenaro')
router.register(r'ordencompleta', CompletaOrdenViewSet, base_name='ordencompleta')
router.register(r'ordenlente', LenteOrdenViewSet, base_name='ordenlente')
router.register(r'ordenrepair', RepairOrdenViewSet, base_name='ordenrepair')
urlpatterns = [
    url("^refraction/(?P<pk>[0-9]+)$",refraction_detail,name="refraction"),
]